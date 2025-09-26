// frontend/pages/login.js
import { useState } from "react";
import { Box, Input, Button, Heading, VStack } from "@chakra-ui/react";
import { postToken } from "../lib/api";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const data = await postToken(username, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      router.push("/assets");
    } catch (err) {
      alert("Login failed");
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={12} p={6} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={4}>Sign In</Heading>
      <form onSubmit={onSubmit}>
        <VStack spacing={3}>
          <Input placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <Button type="submit" colorScheme="blue">Login</Button>
        </VStack>
      </form>
    </Box>
  );
}
