import pandas as pd
import openpyxl
from openpyxl import load_workbook
import json

def read_headers_simple(file_path, sheet_name="DATA NILAI"):
    """
    Membaca headers dari sheet Excel dan menyimpan ke file
    """
    try:
        # Load workbook
        workbook = load_workbook(file_path, read_only=True)
        
        # Cek apakah sheet ada
        if sheet_name not in workbook.sheetnames:
            print(f"Sheet '{sheet_name}' tidak ditemukan.")
            print(f"Sheet yang tersedia: {workbook.sheetnames}")
            return None
        
        # Pilih sheet
        worksheet = workbook[sheet_name]
        
        # Baca baris pertama (headers)
        headers = []
        for cell in worksheet[1]:  # Baris pertama (index 1)
            if cell.value is not None:
                headers.append(str(cell.value).strip())
            else:
                break  # Stop jika menemukan cell kosong
        
        workbook.close()
        return headers
    except Exception as e:
        print(f"Error: {e}")
        return None

def save_headers_to_file(headers, output_file="headers_data_nilai.txt"):
    """
    Menyimpan headers ke file teks
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("=== HEADERS SHEET DATA NILAI ===\n")
        f.write(f"Total kolom: {len(headers)}\n\n")
        
        for i, header in enumerate(headers, 1):
            f.write(f"{i:3d}. {header}\n")
        
        f.write("\n=== HEADERS DALAM FORMAT JSON ===\n")
        f.write(json.dumps(headers, indent=2, ensure_ascii=False))
        
        f.write("\n\n=== HEADERS UNTUK MAPPING CODE.JS ===\n")
        f.write("// Berdasarkan headers yang ditemukan:\n")
        
        # Identifikasi headers yang relevan
        relevant_headers = {}
        for header in headers:
            header_lower = header.lower()
            if 'nis' in header_lower and 'nisn' not in header_lower:
                relevant_headers['nis'] = header
            elif 'nama siswa' in header_lower or header_lower == 'nama':
                relevant_headers['nama'] = header
            elif header_lower == 'kelas':
                relevant_headers['kelas'] = header
            elif 'semester' in header_lower:
                relevant_headers['semester'] = header
            elif 'tahun ajaran' in header_lower:
                relevant_headers['tahunAjaran'] = header
            elif 'timestamp' in header_lower:
                relevant_headers['timestamp'] = header
        
        f.write("const gradeColumnMap = {\n")
        for field, header in relevant_headers.items():
            f.write(f'  {field}: ["{header}"],\n')
        f.write("};\n")
        
        f.write("\n// Mata pelajaran yang ditemukan:\n")
        subjects = []
        for header in headers:
            # Skip headers yang bukan mata pelajaran
            if any(skip in header.lower() for skip in ['timestamp', 'email', 'nip', 'nama', 'nis', 'kelas', 'semester', 'tahun', 'capaian', 'sakit', 'izin', 'tanpa', 'naik', 'tanggal', 'tema', 'elemen', 'sub-elemen', 'target', 'keterangan', 'ekstrakurikuler']):
                continue
            # Jika header terlihat seperti mata pelajaran
            if len(header) > 3 and not header.isdigit():
                subjects.append(header)
        
        f.write("// Mata pelajaran:\n")
        for subject in subjects[:20]:  # Batasi 20 mata pelajaran pertama
            f.write(f'// - {subject}\n')

def main():
    excel_file = "Data Peserta Didik SMPN 03 Pekalongan (3).xlsx"
    
    print(f"Membaca headers dari: {excel_file}")
    headers = read_headers_simple(excel_file)
    
    if headers:
        print(f"Berhasil membaca {len(headers)} headers")
        
        # Simpan ke file
        output_file = "headers_data_nilai.txt"
        save_headers_to_file(headers, output_file)
        print(f"Headers disimpan ke: {output_file}")
        
        # Tampilkan beberapa headers pertama
        print("\n=== 20 HEADERS PERTAMA ===")
        for i, header in enumerate(headers[:20], 1):
            print(f"{i:2d}. {header}")
        
        if len(headers) > 20:
            print(f"... dan {len(headers) - 20} headers lainnya")
    else:
        print("Gagal membaca headers")

if __name__ == "__main__":
    main()