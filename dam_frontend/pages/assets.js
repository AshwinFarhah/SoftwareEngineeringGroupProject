import { useEffect, useState } from "react";
import {
  Box, Heading, Input, Button, SimpleGrid, Text, VStack,
  FormControl, FormLabel, Textarea, Select, Image, HStack,
  useToast, Divider
} from "@chakra-ui/react";
import Layout from "../components/Layout";
import AssetCard from "../components/AssetCard";
import UploadDropzone from "../components/UploadDropzone";


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
  const [customCategory, setCustomCategory] = useState("");
  const [tag, setTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("desc");
  const toast = useToast();

  const staticCategories = [
    "Images", "Videos", "Documents", "Audio", "Presentations",
    "Spreadsheets", "Animations", "Motion Graphics", "3D Models",
    "Archives", "Others",
  ];

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const r = localStorage.getItem("role");
    if (!t) return;
    setToken(t);
    setRole(r);
    fetchCategories(t).then(() => fetchAssets(t));
  }, [page, sort]);

  async function fetchAssets(t) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assets/?page=${page}&ordering=${sort === "asc" ? "created_at" : "-created_at"}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      const normalizedAssets = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];
      setAssets(normalizedAssets);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setAssets([]);
    }
  }

  async function fetchCategories(t) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      const catList = Array.isArray(data.results) ? data.results : data;

      // ensure static categories exist (auto-create if missing)
      for (const name of staticCategories.filter(c => c !== "Others")) {
        if (!catList.some(c => c.name === name)) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${t}`,
            },
            body: JSON.stringify({ name }),
          });
        }
      }

      const updated = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const finalCats = await updated.json();
      setCategories(Array.isArray(finalCats.results) ? finalCats.results : finalCats);
    } catch (err) {
      console.error("Error fetching categories:", err);
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
    try {
      let finalCategoryId = null;

      // 🟢 Handle "Others" (custom category)
      if (categoryId === "Others" && customCategory) {
        const categoryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: customCategory }),
        });
        if (!categoryRes.ok) throw new Error("Failed to create custom category");
        const newCat = await categoryRes.json();
        finalCategoryId = newCat.id;
      } else {
        // find matching category ID by name
        const found = categories.find(c => c.name === categoryId);
        if (found) finalCategoryId = found.id;
      }

      // 🟢 Prepare form data
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("description", description);
      if (finalCategoryId) formData.append("category_id", finalCategoryId);
      if (tag) formData.append("tags", tag);

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
        setCategoryId("");
        setCustomCategory("");
        fetchAssets(token);
      } else {
        const error = await res.text();
        console.error("Upload error:", error);
        toast({ title: "Upload failed", description: error, status: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error during upload",
        description: err.message,
        status: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <Layout>
      <Box px={6} py={4}>
        <Heading size="lg" mb={2}>
          Asset Management
        </Heading>
        <Text color="gray.500" mb={6}>
          Upload, preview, and manage your digital assets efficiently.
        </Text>

        <Divider mb={6} />

        {(role === "admin" || role === "editor") && (
          <Box bg="gray.50" p={6} rounded="xl" shadow="sm" mb={8}>
            <Heading size="md" mb={4}>
              Upload New Asset
            </Heading>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="Enter asset title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter a short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="Select category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {staticCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {categoryId === "Others" && (
                <FormControl>
                  <FormLabel>Custom Category</FormLabel>
                  <Input
                    placeholder="Enter your own category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Input
                  placeholder="Comma-separated tags"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </FormControl>

              <FormControl>

                <FormLabel>File</FormLabel>
                    <UploadDropzone
                    onFileSelected={(file) => {
                    setSelectedFile(file);
                        setPreview(URL.createObjectURL(file));
                    }}
                preview={preview}
                />
                </FormControl>


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

        <Heading size="md" mb={4}>
          Uploaded Assets
        </Heading>
        {assets.length === 0 ? (
          <Text color="gray.500">No assets found.</Text>
        ) : (
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </SimpleGrid>
        )}

        <HStack justify="center" mt={8} spacing={6}>
          <Button onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page === 1}>
            Previous
          </Button>
          <Text>Page {page}</Text>
          <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
        </HStack>
      </Box>
    </Layout>
  );
}
