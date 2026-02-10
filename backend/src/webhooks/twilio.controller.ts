import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { CallsService } from '../calls/calls.service';

@ApiTags('Webhooks')
@ApiExcludeController()
@Controller('webhooks/twilio')
export class TwilioWebhooksController {
    private readonly logger = new Logger(TwilioWebhooksController.name);

    constructor(private callsService: CallsService) { }

    @Post('voice')
    @ApiOperation({ summary: 'Handle incoming voice call' })
    async handleVoice(@Res() res: Response) {
        const twiml = this.callsService.generateIVRTwiML('ar');
        res.type('text/xml');
        res.send(twiml);
    }

    @Post('ivr-selection')
    @ApiOperation({ summary: 'Handle IVR menu selection' })
    async handleIVRSelection(@Body() body: any, @Res() res: Response) {
        const digit = body.Digits;
        this.logger.log(`IVR selection received: ${digit}`);

        const twiml = this.callsService.generateIVRSelection(digit);
        res.type('text/xml');
        res.send(twiml);
    }

    @Post('status')
    @ApiOperation({ summary: 'Handle call status callback' })
    async handleStatus(@Body() body: any) {
        const { CallSid, CallStatus, CallDuration } = body;

        this.logger.log(`Call status update: ${CallSid} -> ${CallStatus}`);

        await this.callsService.updateCallStatus(
            CallSid,
            CallStatus,
            CallDuration ? parseInt(CallDuration) : undefined,
        );

        return { received: true };
    }

    @Post('recording')
    @ApiOperation({ summary: 'Handle recording status callback' })
    async handleRecording(@Body() body: any) {
        const { CallSid, RecordingSid, RecordingUrl, RecordingDuration } = body;

        this.logger.log(`Recording completed: ${RecordingSid} for call ${CallSid}`);

        await this.callsService.saveCallRecording(
            CallSid,
            RecordingSid,
            RecordingUrl,
            parseInt(RecordingDuration),
        );

        return { received: true };
    }

    @Post('incoming')
    @ApiOperation({ summary: 'Handle incoming call' })
    async handleIncoming(@Body() body: any, @Res() res: Response) {
        const { CallSid, From, To } = body;

        this.logger.log(`Incoming call from ${From} to ${To}`);

        await this.callsService.handleIncomingCall(CallSid, From, To);

        // Return TwiML for IVR
        const twiml = this.callsService.generateIVRTwiML('ar');
        res.type('text/xml');
        res.send(twiml);
    }
}
