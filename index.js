import React from 'react';
import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './src/App';

function Main() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<App />
		</GestureHandlerRootView>
	);
}

registerRootComponent(Main);
