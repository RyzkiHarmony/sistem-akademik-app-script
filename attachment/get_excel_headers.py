import pandas as pd
import os

def get_excel_headers(file_path, output_file):
    """
    Membaca headers dari file Excel dan menyimpan ke file txt
    
    Args:
        file_path (str): Path ke file Excel
        output_file (str): Path untuk menyimpan hasil headers
    """
    try:
        # Baca file Excel
        print(f"Membaca file: {file_path}")
        
        # Baca hanya baris pertama untuk mendapatkan headers
        df = pd.read_excel(file_path, nrows=0)
        
        # Dapatkan nama kolom (headers)
        headers = df.columns.tolist()
        
        print(f"Ditemukan {len(headers)} headers")
        
        # Simpan headers ke file txt
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("Headers dari file: {}\n".format(os.path.basename(file_path)))
            f.write("=" * 50 + "\n\n")
            
            # Tulis headers dengan nomor index
            for i, header in enumerate(headers):
                f.write(f"{i}: {header}\n")
            
            f.write("\n" + "=" * 50 + "\n")
            f.write(f"Total headers: {len(headers)}\n")
        
        print(f"Headers berhasil disimpan ke: {output_file}")
        
        # Tampilkan preview headers
        print("\nPreview headers:")
        for i, header in enumerate(headers[:10]):  # Tampilkan 10 pertama
            print(f"{i}: {header}")
        
        if len(headers) > 10:
            print(f"... dan {len(headers) - 10} headers lainnya")
            
        return headers
        
    except FileNotFoundError:
        print(f"Error: File tidak ditemukan - {file_path}")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

def main():
    # Path ke file Excel
    excel_file = "attachment/Data Peserta Didik SMPN 03 Pekalongan (3).xlsx"
    
    # Path output file
    output_file = "attachment/headers_data_siswa.txt"
    
    # Pastikan file Excel ada
    if not os.path.exists(excel_file):
        print(f"File Excel tidak ditemukan: {excel_file}")
        print("Pastikan file berada di folder attachment/")
        return
    
    # Dapatkan headers
    headers = get_excel_headers(excel_file, output_file)
    
    if headers:
        print("\nScript selesai dijalankan!")
        print(f"Hasil disimpan di: {output_file}")
    else:
        print("\nGagal mendapatkan headers dari file Excel")

if __name__ == "__main__":
    main()