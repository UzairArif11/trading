import React from "react"

import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-alpine.min.css"; // Optional: theme

function DataTableComponent({ columnDefs, data, width }) {
    const defColDef = React.memo(() => {
        return {
            resizable: true,
            sortable: true,
            width,
        };
    }, [width])
    const autoSizeStrategy = React.useMemo(() => {
        return {
          type: "fitGridWidth",
          width: width,
        };
      }, [width]);
    return (
        <AgGridReact
            columnDefs={columnDefs}
            rowData={data}
            pagination={true}
            paginationAutoPageSize={true}
            // onGridReady={(params) => params.api.sizeColumnsToFit()}
            domLayout="normal"
            defaultColDef={defColDef}
            autoSizeStrategy={autoSizeStrategy}
            containerStyle={{ height: 'calc(100% - 45px)' }}
        />
    )
}

export default DataTableComponent
