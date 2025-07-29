import React, { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const ApiTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deselectedIds, setDeselectedIds] = useState<Set<number>>(new Set());
  const [selectRowsCount, setSelectRowsCount] = useState<string>("");
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const overlayRef = useRef<OverlayPanel>(null);

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data: ApiResponse = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch artworks:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  useEffect(() => {
    const selected = artworks.filter(
      (artwork) => selectedIds.has(artwork.id) && !deselectedIds.has(artwork.id)
    );
    setSelectedArtworks(selected);
  }, [artworks, selectedIds, deselectedIds]);

  const handlePageChange = (event: any) => {
    setCurrentPage(event.page + 1);
  };

  const isSelected = (id: number): boolean => {
    return selectedIds.has(id) && !deselectedIds.has(id);
  };

  const handleSelectionChange = (e: any) => {
    const selected = e.value as Artwork[];
    const newSelected = new Set(selectedIds);
    const newDeselected = new Set(deselectedIds);

    artworks.forEach((artwork) => {
      const isCurrentlySelected = selected.some((s) => s.id === artwork.id);

      if (isCurrentlySelected) {
        newSelected.add(artwork.id);
        newDeselected.delete(artwork.id);
      } else {
        newSelected.delete(artwork.id);
        newDeselected.add(artwork.id);
      }
    });

    setSelectedIds(newSelected);
    setDeselectedIds(newDeselected);
  };

  const handleRowSelect = (e: any) => {
    const artwork = e.data as Artwork;
    const newSelected = new Set(selectedIds);
    const newDeselected = new Set(deselectedIds);

    newSelected.add(artwork.id);
    newDeselected.delete(artwork.id);

    setSelectedIds(newSelected);
    setDeselectedIds(newDeselected);
  };

  const handleRowUnselect = (e: any) => {
    const artwork = e.data as Artwork;
    const newSelected = new Set(selectedIds);
    const newDeselected = new Set(deselectedIds);

    newSelected.delete(artwork.id);
    newDeselected.add(artwork.id);

    setSelectedIds(newSelected);
    setDeselectedIds(newDeselected);
  };

  const selectMultipleRows = async () => {
    const count = parseInt(selectRowsCount);
    if (!count || count <= 0) return;

    const newSelected = new Set(selectedIds);
    const newDeselected = new Set(deselectedIds);
    let remaining = count;
    let page = currentPage;

    while (remaining > 0) {
      let pageData: Artwork[] = [];

      if (page === currentPage) {
        pageData = artworks;
      } else {
        try {
          const response = await fetch(
            `https://api.artic.edu/api/v1/artworks?page=${page}`
          );
          const data: ApiResponse = await response.json();
          pageData = data.data;

          if (!pageData || pageData.length === 0) break;
        } catch (error) {
          console.error("Error fetching page:", error);
          break;
        }
      }

      if (page === currentPage) {
        pageData.forEach((artwork) => newSelected.delete(artwork.id));
      }

      const toSelect = Math.min(remaining, pageData.length);
      const selectedFromPage = pageData.slice(0, toSelect);

      selectedFromPage.forEach((artwork) => {
        newSelected.add(artwork.id);
        newDeselected.delete(artwork.id);
      });

      if (page === currentPage) {
        pageData.forEach((artwork) => {
          if (!selectedFromPage.some((s) => s.id === artwork.id)) {
            newDeselected.add(artwork.id);
          }
        });
      } else {
        pageData.slice(toSelect).forEach((artwork) => {
          newDeselected.add(artwork.id);
        });
      }

      remaining -= toSelect;
      page++;

      if (page > 100) break;
    }

    setSelectedIds(newSelected);
    setDeselectedIds(newDeselected);
    setSelectRowsCount("");
    overlayRef.current?.hide();
  };

  const renderHeaderCheckbox = () => {
    const currentIds = artworks.map((a) => a.id);
    const selectedOnPage = currentIds.filter((id) => isSelected(id));
    const allSelected =
      currentIds.length > 0 && selectedOnPage.length === currentIds.length;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Checkbox
          checked={allSelected}
          onChange={(e) => {
            const newSelected = new Set(selectedIds);
            const newDeselected = new Set(deselectedIds);

            if (e.checked) {
              artworks.forEach((artwork) => {
                newSelected.add(artwork.id);
                newDeselected.delete(artwork.id);
              });
            } else {
              artworks.forEach((artwork) => {
                newSelected.delete(artwork.id);
                newDeselected.add(artwork.id);
              });
            }

            setSelectedIds(newSelected);
            setDeselectedIds(newDeselected);
          }}
        />
        <Button
          icon="pi pi-chevron-down"
          text
          size="small"
          onClick={(e) => overlayRef.current?.toggle(e)}
          style={{ padding: "2px" }}
        />
        <OverlayPanel ref={overlayRef} style={{ width: "250px" }}>
          <div style={{ padding: "16px" }}>
            <InputText
              value={selectRowsCount}
              onChange={(e) => setSelectRowsCount(e.target.value)}
              placeholder="Select rows..."
              style={{ width: "100%", marginBottom: "8px" }}
              type="number"
              min="1"
            />
            <Button
              label="submit"
              onClick={selectMultipleRows}
              size="small"
              style={{ width: "100%" }}
              disabled={!selectRowsCount || parseInt(selectRowsCount) <= 0}
            />
          </div>
        </OverlayPanel>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        API DataTable using Prime React - GrowMeOrganic
      </h1>

      <div className="mb-4">
        <p>Selected: {selectedIds.size} items</p>
      </div>

      <DataTable
        value={artworks}
        loading={loading}
        selection={selectedArtworks}
        onSelectionChange={handleSelectionChange}
        onRowSelect={handleRowSelect}
        onRowUnselect={handleRowUnselect}
        selectionMode="multiple"
        dataKey="id"
        className="p-datatable-sm"
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
          header={renderHeaderCheckbox}
        />
        <Column field="title" header="Title" style={{ minWidth: "200px" }} />
        <Column
          field="place_of_origin"
          header="Place of Origin"
          style={{ minWidth: "150px" }}
        />
        <Column
          field="artist_display"
          header="Artist"
          style={{ minWidth: "200px" }}
        />
        <Column
          field="inscriptions"
          header="Inscriptions"
          style={{ minWidth: "150px" }}
        />
        <Column
          field="date_start"
          header="Date Start"
          style={{ minWidth: "100px" }}
        />
        <Column
          field="date_end"
          header="Date End"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Paginator
        first={(currentPage - 1) * 12}
        rows={12}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        className="mt-4"
      />
    </div>
  );
};

export default ApiTable;
