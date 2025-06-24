import { useState, useMemo } from "react";

const useSearch = (data, column) => {
  const [search, setSearch] = useState("");
  const filteredData = useMemo(() => {
    return data.filter((d) =>
      d[column]
        ?.toString()
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search, column]);

  return {
    search,
    setSearch,
    filteredData,
  };
};

export default useSearch;