// frontend/pages/assets.js
import { useEffect, useState } from "react";
import { Box, Heading, Input, Button, SimpleGrid, Text } from "@chakra-ui/react";
import UploadDropzone from "../components/UploadDropzone";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // user role
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const r = localStorage.getItem("role");
    if (!t) return;
    setToken(t);
    setRole(r);
    fetchAssets(t);
  }, []);

  async function fetchAssets(t) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  function onUploaded() {
    fetchAssets(token);
  }

  return (
    <Box p={6}>
      <Heading>Assets</Heading>

      <Box mt={4}>
        <Input
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          mt={2}
          onClick={() => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/?search=${encodeURIComponent(query)}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((data) => setAssets(Array.isArray(data) ? data : []))
              .catch(console.error);
          }}
        >
          Search
        </Button>
      </Box>

        {["admin", "editor"].includes(role) && <UploadDropzone token={token} onUploaded={onUploaded} />}
        {assets.map(a => (
            <Box key={a.id} borderWidth={1} p={3} borderRadius="md">
            <Text fontWeight="bold">{a.title} (v{a.version})</Text>
            <Text fontSize="sm">{a.description}</Text>
            <Text fontSize="xs">{a.category?.name}</Text>

        {(["admin"].includes(role) || (role === "editor" && a.uploaded_by.username === localStorage.getItem("username"))) &&
            <Button size="xs" mt={1}>Edit</Button>
            }

            <a href={`${process.env.NEXT_PUBLIC_API_URL.replace("/api","")}${a.file}`} target="_blank" rel="noreferrer">Preview / Download</a>
            </Box>
        ))}


      <SimpleGrid columns={[1, 2, 3]} spacing={4} mt={6}>
        {assets.map((a) => (
          <Box key={a.id} borderWidth={1} p={3} borderRadius="md">
            <Text fontWeight="bold">
              {a.title} (v{a.version})
            </Text>
            <Text fontSize="sm">{a.description}</Text>
            <Text fontSize="xs">{a.category?.name}</Text>

            // Admin can edit any asset; Editor can edit only own assets
            {(role === "admin" || (role === "editor" && a.uploaded_by?.username === localStorage.getItem("username"))) && (
                <Button size="xs" mt={1}>Edit</Button>
            )}


            {/* Preview / Download link available to all roles */}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL.replace("/api", "")}${a.file}`}
              target="_blank"
              rel="noreferrer"
            >
              Preview / Download
            </a>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
