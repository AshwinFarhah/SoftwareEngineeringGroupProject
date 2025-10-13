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

  // Fetch asset & versions on mount
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
      if (!res.ok) throw new Error("Failed to fetch asset");
      const data = await res.json();
      setAsset(data);
      setUpdatedAsset({
        title: data.title || "",
        description: data.description || "",
        category: data.category?.name || "",
        customCategory: "",
        tags: data.tags?.map(t => t.name).join(",") || "",
        file: null,
      });
    } catch (err) {
      console.error("Error fetching asset:", err);
      toast({ title: "Failed to fetch asset", status: "error" });
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
      console.error("Error fetching versions:", err);
    }
  }

  // ----------------- Update Asset -----------------
  async function handleUpdate() {
    try {
      if (!token) return;

      // ----------------- Editor submits update request -----------------
      if (role === "editor") {
        if (!updatedAsset.file) {
          toast({ title: "Please select a file to update.", status: "warning" });
          return;
        }

        const formData = new FormData();
        formData.append("file", updatedAsset.file);
        if (updatedAsset.title) formData.append("title", updatedAsset.title);
        if (updatedAsset.description) formData.append("description", updatedAsset.description);
        if (updatedAsset.customCategory) {
          formData.append("category", updatedAsset.customCategory);
        } else if (updatedAsset.category) {
          formData.append("category", updatedAsset.category);
        }
        if (updatedAsset.tags) formData.append("tags", updatedAsset.tags);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/request_update/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`, // DO NOT set 'Content-Type'
            },
            body: formData,
          }
        );

        if (res.ok) {
          toast({ title: "Update request submitted for admin approval.", status: "success" });
          setIsEditing(false);
          fetchVersions(token, id);
        } else {
          const errData = await res.json();
          toast({ title: errData.detail || "Failed to submit update request", status: "error" });
        }
      }
      // ----------------- Admin updates directly -----------------
      else {
        const payload = {
          title: updatedAsset.title,
          description: updatedAsset.description,
          category: updatedAsset.customCategory || updatedAsset.category || "",
          tags: updatedAsset.tags || "",
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast({ title: "Asset updated successfully", status: "success" });
          setIsEditing(false);
          fetchAsset(token, id);
        } else {
          const errData = await res.json();
          toast({ title: errData.detail || "Failed to update asset", status: "error" });
        }
      }
    } catch (err) {
      console.error("Update failed:", err);
      toast({ title: "Error updating asset", status: "error" });
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
      } else {
        toast({ title: "Failed to delete asset", status: "error" });
      }
    } catch (err) {
      console.error("Delete failed:", err);
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
        body: JSON.stringify({ status: approve ? "approved" : "rejected" }),
      });
      if (res.ok) {
        toast({ title: approve ? "Version approved" : "Version rejected", status: approve ? "success" : "warning" });
        fetchVersions(token, id);
        fetchAsset(token, id);
      } else {
        toast({ title: "Failed to update version status", status: "error" });
      }
    } catch (err) {
      console.error("Approval failed:", err);
    }
  }

  if (!id || isLoading) {
    return (
      <Layout>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={3}>Loading asset details...</Text>
        </Box>
      </Layout>
    );
  }

  const filePath = asset?.file || "";
  const base = process.env.NEXT_PUBLIC_API_URL.replace("/api", "");
  const fullUrl = filePath.startsWith("http") ? filePath : `${base}${filePath}`;

  return (
    <Layout>
      <Box px={6} py={6}>
        <Heading mb={4}>Asset Details</Heading>
        {asset ? (
          <Box bg="gray.50" p={6} rounded="xl" shadow="md">
            <HStack align="start" spacing={8}>
              <Box flex="1" textAlign="center">
                {filePath ? (
                  /\.(jpg|jpeg|png|webp)$/i.test(filePath) ? (
                    <Image src={fullUrl} alt={asset.title} maxH="300px" mx="auto" rounded="lg" shadow="sm" />
                  ) : filePath.endsWith(".mp4") ? (
                    <video src={fullUrl} controls width="100%" style={{ borderRadius: "12px" }} />
                  ) : (
                    <Box bg="gray.200" p={4} rounded="md"><Text>No preview available</Text></Box>
                  )
                ) : <Box bg="gray.200" p={4} rounded="md"><Text>No preview available</Text></Box>}

                <HStack justify="center" mt={4}>
                  <Button colorScheme="blue" onClick={() => window.open(fullUrl, "_blank")}>Open</Button>
                  <Button onClick={() => window.open(fullUrl, "_blank")}>Download</Button>
                </HStack>
              </Box>

              <Box flex="1">
                <Heading size="md" mb={3}>Metadata</Heading>
                {isEditing ? (
                  <VStack align="stretch" spacing={3}>
                    <Input
                      value={updatedAsset.title || ""}
                      onChange={e => setUpdatedAsset({ ...updatedAsset, title: e.target.value })}
                      placeholder="Title"
                      isRequired
                    />
                    <Textarea
                      value={updatedAsset.description || ""}
                      onChange={e => setUpdatedAsset({ ...updatedAsset, description: e.target.value })}
                      placeholder="Description"
                      isRequired
                    />

                    <select
                      style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                      value={updatedAsset.category || "Others"}
                      onChange={e => {
                        const val = e.target.value;
                        setUpdatedAsset({
                          ...updatedAsset,
                          category: val === "Others" ? "" : val,
                          customCategory: val === "Others" ? "" : null,
                        });
                      }}
                    >
                      <option value="">Select Category</option>
                      <option value="Images">Images</option>
                      <option value="Videos">Videos</option>
                      <option value="Documents">Documents</option>
                      <option value="Audio">Audio</option>
                      <option value="Presentations">Presentations</option>
                      <option value="Spreadsheets">Spreadsheets</option>
                      <option value="Animations">Animations</option>
                      <option value="Motion Graphics">Motion Graphics</option>
                      <option value="3D Models">3D Models</option>
                      <option value="Archives">Archives</option>
                      <option value="Others">Others</option>
                    </select>

                    {updatedAsset.customCategory !== null && (
                      <Input
                        placeholder="Enter custom category"
                        value={updatedAsset.customCategory || ""}
                        onChange={e => setUpdatedAsset({ ...updatedAsset, customCategory: e.target.value })}
                      />
                    )}

                    <Input
                      placeholder="Tags (comma separated)"
                      value={updatedAsset.tags || ""}
                      onChange={e => setUpdatedAsset({ ...updatedAsset, tags: e.target.value })}
                    />

                    {/* NEW: File input for editor update */}
                    {role === "editor" && (
                      <Input
                        type="file"
                        onChange={e => setUpdatedAsset({ ...updatedAsset, file: e.target.files[0] })}
                      />
                    )}

                    <Button
                      colorScheme="green"
                      onClick={() => {
                        if (!updatedAsset.title || !updatedAsset.description || !(updatedAsset.category || updatedAsset.customCategory)) {
                          toast({ title: "Please fill in all required fields.", status: "warning" });
                          return;
                        }
                        handleUpdate();
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </VStack>
                ) : (
                  <>
                    <Text><b>Title:</b> {asset.title}</Text>
                    <Text><b>Description:</b> {asset.description || "—"}</Text>
                    <Text><b>Uploader:</b> {asset.uploaded_by?.username || "N/A"}</Text>
                    <Text><b>Category:</b> {asset.category?.name || "Uncategorized"}</Text>
                    <Text><b>Uploaded:</b> {new Date(asset.uploaded_at).toLocaleString()}</Text>

                    {role && (
                      <Button mt={4} colorScheme="teal" onClick={() => setIsEditing(true)}>Edit Metadata</Button>
                    )}
                    {role === "admin" && <Button mt={4} colorScheme="red" onClick={handleDelete}>Delete Asset</Button>}
                  </>
                )}
              </Box>
            </HStack>

            {versions.length > 0 && (
              <>
                <Divider my={6} />
                <Heading size="md" mb={3}>Version History</Heading>
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
                    {Array.isArray(versions) && versions.map(v => (
                      <Tr key={v.id}>
                        <Td>{v.version}</Td>
                        <Td>{v.uploaded_by?.username || "N/A"}</Td>
                        <Td>{new Date(v.uploaded_at).toLocaleString()}</Td>
                        <Td>
                          <Badge colorScheme={v.status === "approved" ? "green" : v.status === "pending" ? "yellow" : "red"}>
                            {v.status}
                          </Badge>
                        </Td>
                        {role === "admin" && (
                          <Td>
                            {v.status === "pending" && (
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
              </>
            )}
          </Box>
        ) : <Text>No asset found.</Text>}
      </Box>
    </Layout>
  );
}
