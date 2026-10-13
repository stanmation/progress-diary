import React from 'react';
import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './src/App';

function Main() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<App />
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

registerRootComponent(Main);
