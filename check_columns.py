import pandas as pd

# Baca file Excel
df = pd.read_excel(r'd:\VSCode Data\magang\web\admin_dashboard\Data Peserta Didik SMPN 03 Pekalongan.xlsx', sheet_name='DATA SISWA')

print('=== KOLOM YANG MENGANDUNG NIS ===')
for i, col in enumerate(df.columns):
    if 'nis' in col.lower():
        print(f'{i+1}. {col}')

print('\n=== KOLOM YANG MENGANDUNG TANGGAL/DITERIMA/MASUK/DAFTAR ===')
for i, col in enumerate(df.columns):
    if any(keyword in col.lower() for keyword in ['tanggal', 'diterima', 'masuk', 'daftar']):
        print(f'{i+1}. {col}')

print('\n=== SEMUA KOLOM (10 PERTAMA) ===')
for i, col in enumerate(df.columns[:10]):
    print(f'{i+1}. {col}')

print('\n=== CONTOH DATA BARIS PERTAMA ===')
print('NIS:', df.iloc[0]['NIS'] if 'NIS' in df.columns else 'Kolom NIS tidak ditemukan')
if 'Tanggal Diterima' in df.columns:
    print('Tanggal Diterima:', df.iloc[0]['Tanggal Diterima'])
else:
    print('Kolom Tanggal Diterima tidak ditemukan')