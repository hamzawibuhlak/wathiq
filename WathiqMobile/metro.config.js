const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    resolver: {
        // Force axios to resolve its browser-compatible ESM bundle
        // instead of the Node.js CJS bundle that requires crypto/http
        resolveRequest: (context, moduleName, platform) => {
            if (moduleName === 'axios') {
                return {
                    filePath: path.resolve(
                        __dirname,
                        'node_modules/axios/dist/esm/axios.js',
                    ),
                    type: 'sourceFile',
                };
            }
            return context.resolveRequest(context, moduleName, platform);
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
