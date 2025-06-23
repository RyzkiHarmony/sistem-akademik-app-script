import pandas as pd
import openpyxl
from openpyxl import load_workbook
import sys
import os

def read_excel_headers_pandas(file_path, sheet_name="DATA NILAI"):
    """
    Membaca headers dari sheet Excel menggunakan pandas
    """
    try:
        # Baca file Excel dengan pandas
        df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=0)
        headers = df.columns.tolist()
        return headers
    except Exception as e:
        print(f"Error menggunakan pandas: {e}")
        return None

def read_excel_headers_openpyxl(file_path, sheet_name="DATA NILAI"):
    """
    Membaca headers dari sheet Excel menggunakan openpyxl
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
                headers.append(str(cell.value))
            else:
                headers.append("")
        
        # Hapus kolom kosong di akhir
        while headers and headers[-1] == "":
            headers.pop()
        
        workbook.close()
        return headers
    except Exception as e:
        print(f"Error menggunakan openpyxl: {e}")
        return None

def print_headers_info(headers):
    """
    Menampilkan informasi headers dengan format yang rapi
    """
    if not headers:
        print("Tidak ada headers yang ditemukan.")
        return
    
    print(f"\n=== HEADERS SHEET DATA NILAI ===")
    print(f"Total kolom: {len(headers)}")
    print("\nDaftar Headers:")
    print("-" * 50)
    
    for i, header in enumerate(headers, 1):
        print(f"{i:2d}. {header}")
    
    print("\n=== MAPPING UNTUK CODE.JS ===")
    print("Berikut adalah mapping yang bisa digunakan di code.js:")
    print()
    
    # Generate mapping berdasarkan headers yang ditemukan
    mapping_suggestions = {
        "nis": ["NIS", "nis", "Nomor Induk Siswa"],
        "nama": ["NAMA", "nama", "Nama Siswa", "Nama Lengkap"],
        "kelas": ["KELAS", "kelas", "Kelas"],
        "mataPelajaran": ["MATA PELAJARAN", "mata_pelajaran", "Mata Pelajaran", "Mapel"],
        "semester": ["SEMESTER", "semester", "Semester", "SMT"],
        "tahunAjaran": ["TAHUN AJARAN", "tahun_ajaran", "Tahun Ajaran", "TA"],
        "nilaiTugas": ["NILAI TUGAS", "nilai_tugas", "Nilai Tugas", "Tugas"],
        "nilaiUTS": ["NILAI UTS", "nilai_uts", "Nilai UTS", "UTS"],
        "nilaiUAS": ["NILAI UAS", "nilai_uas", "Nilai UAS", "UAS"],
        "nilaiAkhir": ["NILAI AKHIR", "nilai_akhir", "Nilai Akhir", "Nilai Final"],
        "grade": ["GRADE", "grade", "Grade", "Huruf"],
        "keterangan": ["KETERANGAN", "keterangan", "Keterangan", "Ket"],
        "tanggalInput": ["TANGGAL INPUT", "tanggal_input", "Tanggal Input", "Tgl Input"]
    }
    
    print("const columnMappings = {")
    for field, possible_names in mapping_suggestions.items():
        # Cari header yang cocok
        matched_header = None
        for header in headers:
            if header.upper() in [name.upper() for name in possible_names]:
                matched_header = header
                break
        
        if matched_header:
            print(f'  {field}: ["{matched_header}", ...], // ✓ DITEMUKAN')
        else:
            print(f'  {field}: {possible_names}, // ✗ TIDAK DITEMUKAN')
    
    print("};")

def main():
    # Path ke file Excel
    excel_file = "Data Peserta Didik SMPN 03 Pekalongan (3).xlsx"
    
    # Cek apakah file ada
    if not os.path.exists(excel_file):
        print(f"File '{excel_file}' tidak ditemukan di direktori saat ini.")
        print(f"Direktori saat ini: {os.getcwd()}")
        return
    
    print(f"Membaca file: {excel_file}")
    print(f"Sheet: DATA NILAI")
    
    # Coba dengan openpyxl terlebih dahulu
    print("\n=== Menggunakan openpyxl ===")
    headers_openpyxl = read_excel_headers_openpyxl(excel_file)
    
    if headers_openpyxl:
        print_headers_info(headers_openpyxl)
    else:
        print("Gagal membaca dengan openpyxl, mencoba dengan pandas...")
        
        # Coba dengan pandas
        print("\n=== Menggunakan pandas ===")
        headers_pandas = read_excel_headers_pandas(excel_file)
        
        if headers_pandas:
            print_headers_info(headers_pandas)
        else:
            print("Gagal membaca headers dengan kedua metode.")

if __name__ == "__main__":
    main()