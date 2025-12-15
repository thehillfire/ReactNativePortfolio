import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
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
            title: "Home",
            headerStyle: {
              backgroundColor: "#25292e",
            },
            headerTintColor: "#ffffff",
            contentStyle: { backgroundColor: "#000000" },
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
