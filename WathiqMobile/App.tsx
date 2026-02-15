import React, { useEffect } from 'react';
import { StatusBar, I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from './src/theme/theme';
import { colors } from './src/theme/colors';
import { useAuthStore } from './src/store/authStore';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoadingSpinner } from './src/components/common/LoadingSpinner';

// ── Force RTL for Arabic ──
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// ── React Query Client ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// ── Root Stack (Auth vs Main) ──
const RootStack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, isInitialized, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (!isInitialized) {
    return <LoadingSpinner message="جاري تحميل التطبيق..." />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="App" component={AppNavigator} />
      ) : (
        <RootStack.Screen name="Login" component={LoginScreen} />
      )}
    </RootStack.Navigator>
  );
}

// ── App Entry ──
function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer>
              <StatusBar
                barStyle="dark-content"
                backgroundColor={colors.white}
              />
              <RootNavigator />
            </NavigationContainer>
          </QueryClientProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
