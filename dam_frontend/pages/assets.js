// pages/assets.js
import { useEffect, useState } from "react";
import {
  Box, Heading, Input, Button, SimpleGrid, Text, VStack,
  FormControl, FormLabel, Textarea, Select, Image, HStack,
  useToast, Spinner, Divider
} from "@chakra-ui/react";
import Layout from "../components/Layout";
import AssetCard from "../components/AssetCard";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tag, setTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("desc");
  const toast = useToast();

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const r = localStorage.getItem("role");
    if (!t) return;
    setToken(t);
    setRole(r);
    fetchAssets(t);
    fetchCategories(t);
  }, [page, sort]);

  async function fetchAssets(t) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/?page=${page}&ordering=${sort === "asc" ? "created_at" : "-created_at"}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setAssets(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCategories(t) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !title) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and select a file.",
        status: "warning",
      });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("description", description);
    if (categoryId) formData.append("category_id", categoryId);
    if (tag) formData.append("tags", tag);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Upload successful", status: "success" });
        setSelectedFile(null);
        setPreview(null);
        setTitle("");
        setDescription("");
        setTag("");
        fetchAssets(token);
      } else {
        toast({ title: "Upload failed", status: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error uploading file", status: "error" });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSearch() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/?search=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAssets(Array.isArray(data.results) ? data.results : data);
  }

  return (
    <Layout>
      <Box px={6} py={4}>
        <Heading size="lg" mb={2}>Asset Management</Heading>
        <Text color="gray.500" mb={6}>
          Upload, preview, and manage your digital assets efficiently.
        </Text>

        <Divider mb={6} />

        {(role === "admin" || role === "editor") && (
          <Box bg="gray.50" p={6} rounded="xl" shadow="sm" mb={8}>
            <Heading size="md" mb={4}>Upload New Asset</Heading>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input placeholder="Enter asset title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea placeholder="Enter a short description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select placeholder="Select category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Input placeholder="Comma-separated tags" value={tag} onChange={(e) => setTag(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>File</FormLabel>
                <Input type="file" onChange={handleFileChange} />
              </FormControl>
              {preview && (
                <Box textAlign="center">
                  <Text fontWeight="semibold" mb={2}>Preview:</Text>
                  <Image src={preview} alt="Preview" maxH="200px" mx="auto" rounded="lg" />
                </Box>
              )}
              <Button
                colorScheme="blue"
                onClick={handleUpload}
                isLoading={isUploading}
                loadingText="Uploading..."
              >
                Submit Asset
              </Button>
            </VStack>
          </Box>
        )}

        {/* Asset Grid */}
        <Heading size="md" mb={4}>Uploaded Assets</Heading>
        {assets.length === 0 ? (
          <Text color="gray.500">No assets found.</Text>
        ) : (
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </SimpleGrid>
        )}

        {/* Pagination */}
        <HStack justify="center" mt={8} spacing={6}>
          <Button onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page === 1}>Previous</Button>
          <Text>Page {page}</Text>
          <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
        </HStack>
      </Box>
    </Layout>
  );
}
