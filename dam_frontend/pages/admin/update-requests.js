import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  Spinner,
  useToast,
  HStack,
  VStack,
  Divider,
} from "@chakra-ui/react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";

export default function UpdateRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const r = localStorage.getItem("role");

    if (!t) {
      router.push("/login");
      return;
    }

    setToken(t);
    setRole(r);
    if (r?.toLowerCase() === "admin") {
      fetchRequests(t);
    } else {
      toast({
        title: "Access Denied",
        description: "Only admins can view this page.",
        status: "error",
      });
      router.push("/dashboard");
    }
  }, []);

  async function fetchRequests(t) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/versions/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      const versionList = Array.isArray(data.results) ? data.results : data;

      // Filter to only pending requests
      const pending = versionList.filter(
        (v) => v.status && v.status.toLowerCase() === "pending approval"
      );
      setRequests(pending);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch update requests", status: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(id, approve = true) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/versions/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: approve ? "Approved" : "Rejected" }),
      });

      if (res.ok) {
        toast({
          title: approve ? "Request Approved" : "Request Rejected",
          status: approve ? "success" : "warning",
        });
        fetchRequests(token);
      } else {
        toast({
          title: "Failed to update request",
          status: "error",
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Server error", status: "error" });
    }
  }

  if (loading) return <Spinner size="xl" />;

  return (
    <Layout>
      <Box p={8}>
        <Heading mb={6}>🔔 Update Requests </Heading>

        {requests.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text color="gray.500" fontSize="lg">
              No pending update requests at the moment.
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing={5}>
            {requests.map((req) => (
              <Box
                key={req.id}
                p={5}
                borderWidth="1px"
                borderRadius="xl"
                shadow="sm"
                bg="white"
              >
                <HStack justify="space-between" mb={2}>
                  <Heading size="sm">Asset: {req.asset?.title || "Untitled"}</Heading>
                  <Badge
                    colorScheme={
                      req.status === "Approved"
                        ? "green"
                        : req.status === "Rejected"
                        ? "red"
                        : "yellow"
                    }
                  >
                    {req.status}
                  </Badge>
                </HStack>

                <Text fontSize="sm" color="gray.600">
                  <b>Version:</b> {req.version_number || "-"}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  <b>Requested by:</b> {req.updated_by?.username || "Unknown"}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  <b>Date:</b>{" "}
                  {req.updated_at
                    ? new Date(req.updated_at).toLocaleString()
                    : "N/A"}
                </Text>

                <Divider my={3} />

                <HStack spacing={3}>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => router.push(`/assets/${req.asset?.id}`)}
                  >
                    View Asset
                  </Button>
                  <Button
                    colorScheme="green"
                    size="sm"
                    onClick={() => handleApproval(req.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    colorScheme="red"
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(req.id, false)}
                  >
                    Reject
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Layout>
  );
}
