import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import HeaderMenuWrapper from "./HeaderMenuWrapper";

export default function RootLayout() {
  return (
    <AuthProvider>
      <HeaderMenuWrapper />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#000000" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="questionnaire"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="character-creation"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="character-name"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="projects"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="purchase-campaign"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="followers"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="following"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="user-profile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="character-view"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="character-list"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="messages"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="game-modes"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="campaign"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="campaign-game"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="co-op"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="versus"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
