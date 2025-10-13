import { Box, Flex, Button, Text, Spacer } from "@chakra-ui/react";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();
  const username = typeof window !== "undefined" ? localStorage.getItem("username") : "";
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const isAdmin = role && role.toLowerCase() === "admin"; // ✅ Case-insensitive check

  return (
    <Box bg="white" boxShadow="sm" px={6} py={3}>
      <Flex align="center">
        <Text fontWeight="bold" fontSize="lg">DAM System</Text>
        <Spacer />

        <Button variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
        <Button variant="ghost" onClick={() => router.push("/assets")}>Assets</Button>
        <Button variant="ghost" onClick={() => router.push("/metadata")}>Metadata</Button>

        {/* 🔒 Admin-only buttons */}
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/update-requests")}
            >
              Update Requests
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/users")}
            >
              Manage Users
            </Button>
          </>
        )}

        <Spacer />
        <Text mr={4} fontSize="sm" color="gray.600">
          {username} ({role})
        </Text>
        <Button
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={() => {
            localStorage.clear();
            router.push("/login");
          }}
        >
          Logout
        </Button>
      </Flex>
    </Box>
  );
}
