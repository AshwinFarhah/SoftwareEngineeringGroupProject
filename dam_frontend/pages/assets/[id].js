import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Box, Heading, Text, Image, Button, VStack, HStack,
  Input, Textarea, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Divider, Spinner, Badge
} from "@chakra-ui/react";
import Layout from "../../components/Layout";

export default function AssetDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [asset, setAsset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedAsset, setUpdatedAsset] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const r = localStorage.getItem("role");
    if (!t || !id) return;
    setToken(t);
    setRole(r);
    fetchAsset(t, id);
    fetchVersions(t, id);
  }, [id]);

  async function fetchAsset(t, id) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      console.log("DEBUG asset data:", data);
      setAsset(data);
      setUpdatedAsset(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchVersions(t, id) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/versions/?asset_id=${id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setVersions(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdate() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAsset),
      });
      if (res.ok) {
        toast({ title: "Asset updated successfully", status: "success" });
        setIsEditing(false);
        fetchAsset(token, id);
      } else {
        toast({ title: "Failed to update asset", status: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Asset deleted", status: "info" });
        router.push("/assets");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function approveVersion(versionId, approve = true) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/versions/${versionId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: approve ? "Approved" : "Rejected" }),
      });
      if (res.ok) {
        toast({
          title: approve ? "Version approved" : "Version rejected",
          status: approve ? "success" : "warning",
        });
        fetchVersions(token, id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoading) return <Spinner size="xl" />;

  // ✅ unified safe file URL
  const filePath = asset?.file || asset?.file_url || asset?.asset_file || "";
  const base = process.env.NEXT_PUBLIC_API_URL.replace("/api", "");
  const fullUrl = filePath.startsWith("http") ? filePath : `${base}${filePath}`;

  return (
    <Layout>
      <Box px={6} py={6}>
        <Heading mb={4}>Asset Details</Heading>
        {asset ? (
          <Box bg="gray.50" p={6} rounded="xl" shadow="md">
            <HStack align="start" spacing={8}>
              {/* Preview Section */}
              <Box flex="1" textAlign="center">
                {filePath ? (
                  filePath.endsWith(".jpg") || filePath.endsWith(".png") || filePath.endsWith(".jpeg") || filePath.endsWith(".webp") ? (
                    <Image
                      src={fullUrl}
                      alt={asset.title}
                      maxH="300px"
                      mx="auto"
                      rounded="lg"
                      shadow="sm"
                    />
                  ) : filePath.endsWith(".mp4") ? (
                    <video
                      src={fullUrl}
                      controls
                      width="100%"
                      style={{ borderRadius: "12px" }}
                    />
                  ) : (
                    <Box bg="gray.200" p={4} rounded="md">
                      <Text>No preview available for this file type</Text>
                    </Box>
                  )
                ) : (
                  <Box bg="gray.200" p={4} rounded="md">
                    <Text>No preview available</Text>
                  </Box>
                )}

                <HStack justify="center" mt={4}>
                  <Button colorScheme="blue" onClick={() => window.open(fullUrl, "_blank")}>
                    Open
                  </Button>
                  <Button onClick={() => window.open(fullUrl, "_blank")}>
                    Download
                  </Button>
                </HStack>
              </Box>

              {/* Metadata Section */}
              <Box flex="1">
                <Heading size="md" mb={3}>Metadata</Heading>
                {isEditing ? (
                  <VStack align="stretch" spacing={3}>
                    <Input
                      value={updatedAsset.title}
                      onChange={(e) =>
                        setUpdatedAsset({ ...updatedAsset, title: e.target.value })
                      }
                      placeholder="Title"
                    />
                    <Textarea
                      value={updatedAsset.description}
                      onChange={(e) =>
                        setUpdatedAsset({ ...updatedAsset, description: e.target.value })
                      }
                      placeholder="Description"
                    />
                    <Button colorScheme="green" onClick={handleUpdate}>
                      Save Changes
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </VStack>
                ) : (
                  <>
                    <Text><b>Title:</b> {asset.title}</Text>
                    <Text><b>Description:</b> {asset.description || "—"}</Text>
                    <Text><b>Uploader:</b> {asset.uploader?.username || "N/A"}</Text>
                    <Text><b>Category:</b> {asset.category?.name || "Uncategorized"}</Text>
                    <Text>
                      <b>Uploaded:</b>{" "}
                      {asset.created_at
                        ? new Date(asset.created_at).toLocaleString()
                        : asset.uploaded_at
                        ? new Date(asset.uploaded_at).toLocaleString()
                        : "Unknown"}
                    </Text>
                    {role === "editor" && (
                      <Button mt={4} colorScheme="teal" onClick={() => setIsEditing(true)}>
                        Edit Metadata
                      </Button>
                    )}
                    {role === "admin" && (
                      <Button mt={4} colorScheme="red" onClick={handleDelete}>
                        Delete Asset
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </HStack>

            <Divider my={6} />

            {/* Version History Section */}
            <Heading size="md" mb={3}>Version History</Heading>
            {versions.length === 0 ? (
              <Text color="gray.500">No version history available.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Version</Th>
                    <Th>Updated By</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    {role === "admin" && <Th>Actions</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {versions.map((v) => (
                    <Tr key={v.id}>
                      <Td>{v.version_number}</Td>
                      <Td>{v.updated_by?.username || "N/A"}</Td>
                      <Td>{new Date(v.updated_at).toLocaleString()}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            v.status === "Approved"
                              ? "green"
                              : v.status === "Pending Approval"
                              ? "yellow"
                              : "red"
                          }
                        >
                          {v.status}
                        </Badge>
                      </Td>
                      {role === "admin" && (
                        <Td>
                          {v.status === "Pending Approval" && (
                            <HStack>
                              <Button size="sm" colorScheme="green" onClick={() => approveVersion(v.id, true)}>Approve</Button>
                              <Button size="sm" colorScheme="red" onClick={() => approveVersion(v.id, false)}>Reject</Button>
                            </HStack>
                          )}
                        </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        ) : (
          <Text>No asset found.</Text>
        )}
      </Box>
    </Layout>
  );
}
