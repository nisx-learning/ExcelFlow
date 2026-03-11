package com.example.dag.service;

import com.example.dag.model.Edge;
import com.example.dag.model.Node;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class ExcelService {

    public Map<String, Object> parseExcel(MultipartFile file) throws IOException {
        List<Node> nodes = new ArrayList<>();
        List<Edge> edges = new ArrayList<>();
        Set<String> nodeIds = new LinkedHashSet<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell sourceCell = row.getCell(0);
                Cell targetCell = row.getCell(1);

                String source = getCellValue(sourceCell);
                String target = getCellValue(targetCell);

                if (source == null || source.isEmpty() || target == null || target.isEmpty()) {
                    continue;
                }

                nodeIds.add(source);
                nodeIds.add(target);
                edges.add(new Edge(source, target));
            }
        }

        for (String id : nodeIds) {
            nodes.add(new Node(id, id));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            case BLANK -> null;
            default -> null;
        };
    }
}