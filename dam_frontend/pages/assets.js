// frontend/pages/assets.js
import { useEffect, useState } from "react";
import { Box, Heading, Input, Button, SimpleGrid, Text } from "@chakra-ui/react";
import UploadDropzone from "../components/UploadDropzone";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // store user role
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
      setAssets(Array.isArray(data) ? data : []); // ensure assets is always an array
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

      {/* Only show UploadDropzone if user is admin or editor */}
      {["admin", "editor"].includes(role) && (
        <Box mt={6}>
          <UploadDropzone token={token} onUploaded={onUploaded} />
        </Box>
      )}

      {["admin"].includes(role) || (role === "editor" && a.uploaded_by?.id === userId) ? (
            <Button size="xs" mt={1}>Edit</Button>
        ) : null}


      <SimpleGrid columns={[1, 2, 3]} spacing={4} mt={6}>
        {assets.map((a) => (
          <Box key={a.id} borderWidth={1} p={3} borderRadius="md">
            <Text fontWeight="bold">
              {a.title} (v{a.version})
            </Text>
            <Text fontSize="sm">{a.description}</Text>
            <Text fontSize="xs">{a.category?.name}</Text>

            {/* Show edit button only for admin or editor who uploaded the asset */}
            {["admin", "editor"].includes(role) && (
              <Button size="xs" mt={1}>Edit</Button>
            )}

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
