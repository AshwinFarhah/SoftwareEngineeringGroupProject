"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Box, Heading, Text, Image, Button, VStack, HStack,
  Input, Textarea, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Divider, Spinner, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure
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
  const [previewVersion, setPreviewVersion] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
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
      if (!res.ok) throw new Error("Failed to fetch asset");
      const data = await res.json();
      setAsset(data);
      setUpdatedAsset({
        title: data.title || "",
        description: data.description || "",
        category_id: data.category?.id || "",
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

  async function handleUpdate() {
    try {
      if (!token) return;

      // === Editors submit update requests ===
      if (role === "editor") {
        if (!updatedAsset.file) {
          toast({ title: "Please select a file to update.", status: "warning" });
          return;
        }

        const formData = new FormData();
        formData.append("file", updatedAsset.file);
        formData.append("category_id", updatedAsset.category_id);
        if (updatedAsset.title) formData.append("title", updatedAsset.title);
        if (updatedAsset.description) formData.append("description", updatedAsset.description);
        if (updatedAsset.category_id) formData.append("category_id", updatedAsset.category_id);
        if (updatedAsset.tags) formData.append("tags", updatedAsset.tags);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/request_update/`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
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

      // === Admins update directly ===
      } else {
        const formData = new FormData();
        if (updatedAsset.file) formData.append("file", updatedAsset.file);
        formData.append("title", updatedAsset.title);
        formData.append("description", updatedAsset.description);
        if (updatedAsset.category_id) formData.append("category_id", updatedAsset.category_id);
        if (updatedAsset.tags) formData.append("tags", updatedAsset.tags);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/${id}/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
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
                  <Button
                     colorScheme="teal"
                            onClick={async () => {
                            try {
                                const res = await fetch(fullUrl, {
                                 headers: { Authorization: `Bearer ${token}` },
                              });
                                 if (!res.ok) throw new Error("Failed to fetch file");

                                const blob = await res.blob();
                                 const url = window.URL.createObjectURL(blob);

                                const link = document.createElement("a");
                                link.href = url;
                                link.download = asset.title || "download";
                                document.body.appendChild(link);
                                link.click();
                                link.remove();

                                window.URL.revokeObjectURL(url);
                                } catch (err) {
                             console.error("Download failed:", err);
                             toast({ title: "Download failed", status: "error" });
                        }
                            }}
                            >
                        Download
                    </Button>

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
                      value={updatedAsset.category_id || ""}
                      onChange={e => setUpdatedAsset({ ...updatedAsset, category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="1">Images</option>
                      <option value="2">Videos</option>
                      <option value="3">Documents</option>
                      <option value="4">Audio</option>
                      <option value="5">Presentations</option>
                      <option value="6">Spreadsheets</option>
                      <option value="7">Animations</option>
                      <option value="8">Motion Graphics</option>
                      <option value="9">3D Models</option>
                      <option value="10">Archives</option>
                      <option value="11">Others</option>
                    </select>
                    <Input
                      placeholder="Tags (comma separated)"
                      value={updatedAsset.tags || ""}
                      onChange={e => setUpdatedAsset({ ...updatedAsset, tags: e.target.value })}
                    />
                    <Input
                      type="file"
                      onChange={e => setUpdatedAsset({ ...updatedAsset, file: e.target.files[0] })}
                    />
                    <HStack spacing={2}>
                      <Button colorScheme="green" onClick={handleUpdate}>Save Changes</Button>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </HStack>
                  </VStack>
                ) : (
                  <>
                    <Text><b>Title:</b> {asset.title}</Text>
                    <Text><b>Description:</b> {asset.description || "—"}</Text>
                    <Text><b>Uploader:</b> {asset.uploaded_by?.username || "N/A"}</Text>
                    <Text><b>Category:</b> {asset.category?.name || "Uncategorized"}</Text>
                    <Text><b>Uploaded:</b> {new Date(asset.uploaded_at).toLocaleString()}</Text>

                    {(role === "admin" || role === "editor") && (
                      <Button mt={4} colorScheme="teal" onClick={() => setIsEditing(true)}>Edit Metadata</Button>
                    )}
                    {role === "admin" && <Button mt={4} colorScheme="red" onClick={handleDelete}>Delete Asset</Button>}
                  </>
                )}
              </Box>
            </HStack>

            {/* Version History */}
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
                        <Td>
  <HStack spacing={2}>
    {/* View button for everyone */}
    <Button
      size="sm"
      colorScheme="blue"
      onClick={() => {
        setPreviewVersion(v);
        onOpen();
      }}
    >
      View
    </Button>

    {/* Admin-only controls for pending versions */}
    {role === "admin" && v.status === "pending" && (
      <>
        <Button size="sm" colorScheme="green" onClick={() => approveVersion(v.id, true)}>Approve</Button>
        <Button size="sm" colorScheme="red" onClick={() => approveVersion(v.id, false)}>Reject</Button>
      </>
    )}
  </HStack>
</Td>

                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </>
            )}

            {/* Preview Modal */}
            {previewVersion && (
              <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Preview Pending Changes (v{previewVersion.version})</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Text><b>Title:</b> {previewVersion.title}</Text>
                    <Text><b>Description:</b> {previewVersion.description}</Text>
                    <Text><b>Category:</b> {previewVersion.category?.name || "Uncategorized"}</Text>
                    <Text><b>Tags:</b> {previewVersion.tags?.map(t => t.name).join(", ") || "—"}</Text>

                    {previewVersion.file ? (
                      /\.(jpg|jpeg|png|webp)$/i.test(previewVersion.file) ? (
                        <Image
                          src={previewVersion.file?.startsWith("http")
  ? previewVersion.file
  : `${base}${previewVersion.file || ""}`
}
                          maxH="300px"
                          mx="auto"
                          mt={3}
                          rounded="lg"
                          shadow="sm"
                        />
                      ) : previewVersion.file.endsWith(".mp4") ? (
                        <video
                          src={previewVersion.file?.startsWith("http")
  ? previewVersion.file
  : `${base}${previewVersion.file || ""}`
}
                          controls
                          width="100%"
                          style={{ borderRadius: "12px", marginTop: "12px" }}
                        />
                      ) : (
                        <Text mt={3}>No file preview available.</Text>
                      )
                    ) : (
                      <Text mt={3}>No file preview available.</Text>
                    )}
                  </ModalBody>
                </ModalContent>
              </Modal>
            )}
          </Box>
        ) : <Text>No asset found.</Text>}
      </Box>
    </Layout>
  );
}
