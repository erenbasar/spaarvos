import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ListScreen from './src/screens/ListScreen';
import DiscountsScreen from './src/screens/DiscountsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#E8572A',
          tabBarInactiveTintColor: '#BDBDBD',
          tabBarStyle: { paddingBottom: 8, height: 60 },
        }}
      >
        <Tab.Screen
          name="Mijn lijst"
          component={ListScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛒</Text> }}
        />
        <Tab.Screen
          name="Aanbiedingen"
          component={DiscountsScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏷️</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
