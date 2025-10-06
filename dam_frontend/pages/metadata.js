import { Box, Heading, Input, Button, VStack, SimpleGrid, Text } from "@chakra-ui/react";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

export default function MetadataPage(){
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(()=>{ const t = localStorage.getItem('access_token'); if(!t) return; fetchCategories(t); fetchTags(t); }, []);

  function fetchCategories(token){ fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(d=> setCategories(Array.isArray(d) ? d : [])); }
  function fetchTags(token){ fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(d=> setTags(Array.isArray(d) ? d : [])); }

  function addCategory(){ const t = localStorage.getItem('access_token'); if(!newCat) return; fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` }, body: JSON.stringify({ name: newCat }) }).then(()=>{ setNewCat(''); fetchCategories(t); }).catch(console.error); }

  function addTag(){ const t = localStorage.getItem('access_token'); if(!newTag) return; fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` }, body: JSON.stringify({ name: newTag }) }).then(()=>{ setNewTag(''); fetchTags(t); }).catch(console.error); }

  return (
    <Layout>
      <Heading>Metadata Management</Heading>
      <Text color="gray.600" mb={4}>Create and manage categories and tags used to organize assets.</Text>

      <SimpleGrid columns={[1,2]} spacing={6}>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Heading size="sm" mb={3}>Categories</Heading>
          <VStack align="stretch">
            <Input placeholder="New category name" value={newCat} onChange={(e)=>setNewCat(e.target.value)} />
            <Button onClick={addCategory}>Add Category</Button>
            {categories.map(c => <Text key={c.id}>{c.name}</Text>)}
          </VStack>
        </Box>

        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Heading size="sm" mb={3}>Tags</Heading>
          <VStack align="stretch">
            <Input placeholder="New tag name" value={newTag} onChange={(e)=>setNewTag(e.target.value)} />
            <Button onClick={addTag}>Add Tag</Button>
            {tags.map(t=> <Text key={t.id}>{t.name}</Text>)}
          </VStack>
        </Box>
      </SimpleGrid>
    </Layout>
  );
}
