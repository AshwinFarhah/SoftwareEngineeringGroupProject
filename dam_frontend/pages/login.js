import { useState } from "react";
import { Box, Input, Button, Heading, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL; // e.g., http://127.0.0.1:8000/api

  async function onSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();

      // Store tokens
      // after receiving data from API
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username); // store username


      // Decode JWT to get role and user ID
      const payload = JSON.parse(atob(data.access.split(".")[1]));
      localStorage.setItem("role", payload.role);
      localStorage.setItem("userId", payload.user_id); // store user ID for editor restrictions

      console.log("Logged in as role:", payload.role);

      router.push("/assets");
    } catch (err) {
      console.error(err);
      alert("Login failed. Check your credentials.");
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={12} p={6} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={4}>
        Sign In
      </Heading>
      <form onSubmit={onSubmit}>
        <VStack spacing={3}>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" colorScheme="blue" w="full">
            Login
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
