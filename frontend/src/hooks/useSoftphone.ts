import { useState, useRef, useCallback, useEffect } from 'react';
import { callCenterApi, type SipExtension, type CallRecordItem } from '@/api/callCenter';
import * as JsSIP from 'jssip';

/**
 * JsSIP-based softphone hook.
 * Connects to UCM6301 via WSS and manages calls via WebRTC.
 */

export type CallState =
    | 'idle'
    | 'registering'
    | 'registered'
    | 'calling'
    | 'ringing'
    | 'in_call'
    | 'incoming'
    | 'error';

interface UseSoftphoneOptions {
    autoRegister?: boolean;
}

export function useSoftphone(opts: UseSoftphoneOptions = {}) {
    const [state, setState] = useState<CallState>('idle');
    const [extension, setExtension] = useState<SipExtension | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [remoteNumber, setRemoteNumber] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isOnHold, setIsOnHold] = useState(false);
    const [error, setError] = useState('');
    const [callHistory, setCallHistory] = useState<CallRecordItem[]>([]);

    const uaRef = useRef<any>(null);
    const sessionRef = useRef<any>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ── Load extension on mount ──────────────────────
    useEffect(() => {
        loadExtension();
        loadHistory();
        // Create audio element for remote stream
        if (typeof document !== 'undefined') {
            audioRef.current = new Audio();
            audioRef.current.autoplay = true;
        }
        return () => {
            hangup();
            unregister();
        };
    }, []);

    const loadExtension = async () => {
        try {
            const res = await callCenterApi.getMyExtension();
            if (res.data) {
                setExtension(res.data);
                if (opts.autoRegister) {
                    register(res.data);
                }
            }
        } catch {
            // No extension assigned
        }
    };

    const loadHistory = async () => {
        try {
            const res = await callCenterApi.getCallHistory({ limit: 20 });
            setCallHistory(Array.isArray(res.data) ? res.data : []);
        } catch { /* ignore */ }
    };

    // ── SIP Registration ────────────────────────────
    const register = useCallback((ext?: SipExtension) => {
        const sipExt = ext || extension;
        if (!sipExt) {
            setError('لا يوجد Extension معيّن لحسابك');
            return;
        }

        try {
            setState('registering');
            setError('');

            // WSS port: use wssPort if set, otherwise default to 8089
            // (ucmPort is the SIP signaling port like 5061, NOT the WebSocket port)
            const wssPort = (sipExt as any).wssPort || 8089;
            const wssUrl = `wss://${sipExt.ucmHost}:${wssPort}/ws`;
            console.log('[Softphone] Connecting WSS:', wssUrl);

            const socket = new JsSIP.WebSocketInterface(wssUrl);

            const config = {
                sockets: [socket],
                uri: `sip:${sipExt.extension}@${sipExt.ucmHost}`,
                password: sipExt.sipPassword,
                display_name: sipExt.displayName,
                register: true,
                session_timers: false,
            };

            const ua = new JsSIP.UA(config);

            ua.on('registered', () => {
                setState('registered');
                setError('');
            });

            ua.on('registrationFailed', (e: any) => {
                setState('error');
                setError(`فشل التسجيل: ${e?.cause || 'غير معروف'}`);
            });

            ua.on('unregistered', () => {
                setState('idle');
            });

            ua.on('newRTCSession', (data: any) => {
                const session = data.session;

                if (session.direction === 'incoming') {
                    sessionRef.current = session;
                    setRemoteNumber(session.remote_identity?.uri?.user || 'مجهول');
                    setState('incoming');

                    session.on('ended', handleCallEnd);
                    session.on('failed', handleCallEnd);
                }
            });

            ua.start();
            uaRef.current = ua;
        } catch (err: any) {
            setState('error');
            setError(err.message || 'خطأ في الاتصال بالسنترال');
        }
    }, [extension]);

    // ── Make Call ──────────────────────────────────────
    const call = useCallback((number: string) => {
        if (!uaRef.current || state !== 'registered') {
            setError('يجب التسجيل أولاً');
            return;
        }

        try {
            setState('calling');
            setRemoteNumber(number);
            setCallDuration(0);

            const options = {
                mediaConstraints: { audio: true, video: false },
                pcConfig: {
                    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
                },
            };

            const session = uaRef.current.call(
                `sip:${number}@${extension?.ucmHost}`,
                options
            );
            sessionRef.current = session;

            session.on('progress', () => setState('ringing'));
            session.on('accepted', () => {
                setState('in_call');
                startTimer();
            });
            session.on('confirmed', () => {
                // Attach remote audio stream
                const remoteStream = session.connection?.getRemoteStreams?.()[0];
                if (remoteStream && audioRef.current) {
                    audioRef.current.srcObject = remoteStream;
                }
            });
            session.on('ended', handleCallEnd);
            session.on('failed', handleCallEnd);

            // Log call
            callCenterApi.logCall({
                callId: session.id || `call-${Date.now()}`,
                direction: 'OUTBOUND',
                fromNumber: extension?.extension || '',
                toNumber: number,
                status: 'RINGING',
            }).catch(() => { });
        } catch (err: any) {
            setState('registered');
            setError(err.message || 'فشل الاتصال');
        }
    }, [state, extension]);

    // ── Answer Incoming ─────────────────────────────
    const answer = useCallback(() => {
        if (!sessionRef.current) return;
        sessionRef.current.answer({
            mediaConstraints: { audio: true, video: false },
        });
        setState('in_call');
        startTimer();
    }, []);

    // ── Hangup ──────────────────────────────────────
    const hangup = useCallback(() => {
        if (sessionRef.current) {
            try {
                sessionRef.current.terminate();
            } catch { /* already terminated */ }
        }
        handleCallEnd();
    }, []);

    // ── Mute / Hold ─────────────────────────────────
    const toggleMute = useCallback(() => {
        if (!sessionRef.current) return;
        if (isMuted) {
            sessionRef.current.unmute();
        } else {
            sessionRef.current.mute();
        }
        setIsMuted(!isMuted);
    }, [isMuted]);

    const toggleHold = useCallback(() => {
        if (!sessionRef.current) return;
        if (isOnHold) {
            sessionRef.current.unhold();
        } else {
            sessionRef.current.hold();
        }
        setIsOnHold(!isOnHold);
    }, [isOnHold]);

    // ── DTMF ───────────────────────────────────────
    const sendDTMF = useCallback((tone: string) => {
        sessionRef.current?.sendDTMF(tone);
    }, []);

    // ── Unregister ──────────────────────────────────
    const unregister = useCallback(() => {
        if (uaRef.current) {
            uaRef.current.stop();
            uaRef.current = null;
        }
        setState('idle');
    }, []);

    // ── Helpers ─────────────────────────────────────
    const startTimer = () => {
        setCallDuration(0);
        timerRef.current = setInterval(() => {
            setCallDuration((d) => d + 1);
        }, 1000);
    };

    const handleCallEnd = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        sessionRef.current = null;
        setState(uaRef.current ? 'registered' : 'idle');
        setRemoteNumber('');
        setIsMuted(false);
        setIsOnHold(false);
        setCallDuration(0);
        loadHistory();
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return {
        state,
        extension,
        callDuration,
        formattedDuration: formatDuration(callDuration),
        remoteNumber,
        isMuted,
        isOnHold,
        error,
        callHistory,
        register,
        call,
        answer,
        hangup,
        toggleMute,
        toggleHold,
        sendDTMF,
        unregister,
        loadExtension,
        isRegistered: state === 'registered' || state === 'calling' || state === 'ringing' || state === 'in_call' || state === 'incoming',
    };
}

export default useSoftphone;
