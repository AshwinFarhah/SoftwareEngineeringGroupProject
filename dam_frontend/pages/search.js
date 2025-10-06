import { Box, Heading, Input, Button, HStack, VStack, Select } from "@chakra-ui/react";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

export default function SearchPage(){
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(()=>{ const t = localStorage.getItem('access_token'); if(!t) return; fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, { headers:{ Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(d=> setCategories(Array.isArray(d)?d:[])); }, []);

  function doSearch(){
    const t = localStorage.getItem('access_token');
    const params = [];
    if(query) params.push(`search=${encodeURIComponent(query)}`);
    if(category) params.push(`category=${category}`);
    if(dateFrom) params.push(`date_from=${dateFrom}`);
    if(dateTo) params.push(`date_to=${dateTo}`);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/assets/?${params.join('&')}`;
    fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(d=> setResults(Array.isArray(d.results)?d.results:(Array.isArray(d)?d:[]))).catch(console.error);
  }

  return (
    <Layout>
      <Heading>Search & Filters</Heading>
      <VStack align="stretch" spacing={3} mt={4}>
        <Input placeholder="Keyword" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <HStack>
          <Select placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
          <Button onClick={doSearch}>Search</Button>
        </HStack>
      </VStack>

      <Box mt={6}>
        {results.map(r => (
          <Box key={r.id} bg="white" p={3} mb={3} borderRadius="md" boxShadow="sm">
            <Heading size="sm">{r.title}</Heading>
            <p>{r.description}</p>
          </Box>
        ))}
      </Box>
    </Layout>
  );
}
