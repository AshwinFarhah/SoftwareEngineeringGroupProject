
import { useState } from "react";
import { Box, Input, Button, Heading, VStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Decode JWT to get role
      const payload = JSON.parse(atob(data.access.split(".")[1]));
      localStorage.setItem("role", payload.role);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      bgGradient="linear(to-br, blue.50, blue.100)"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        bg="white"
        p={8}
        rounded="2xl"
        shadow="xl"
        w="full"
        maxW="md"
      >
        <Heading size="lg" textAlign="center" mb={6} color="blue.700">
          DAM System Login
        </Heading>
        <form onSubmit={onSubmit}>
          <VStack spacing={4}>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="md"
              focusBorderColor="blue.400"
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="md"
              focusBorderColor="blue.400"
            />
            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              size="md"
              isLoading={loading}
            >
              Sign In
            </Button>
            <Text fontSize="sm" color="gray.500">
              Please enter your credentials to continue
            </Text>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
