import pandas as pd
import random
from datetime import datetime, timedelta
import numpy as np
import os

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

print("Starting to create dummy student data...")

# Lists for generating dummy data
nama_depan_laki = ['Ahmad', 'Budi', 'Dedi', 'Eko', 'Fajar', 'Gilang', 'Hadi', 'Indra', 'Joko', 'Krisna', 'Lukman', 'Maulana', 'Nanda', 'Oka', 'Putra', 'Qori', 'Rizki', 'Satria', 'Taufik', 'Umar', 'Vino', 'Wahyu', 'Yoga', 'Zaki']
nama_depan_perempuan = ['Ayu', 'Bella', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hana', 'Indah', 'Jihan', 'Kartika', 'Lestari', 'Maya', 'Nisa', 'Oktavia', 'Putri', 'Qonita', 'Rina', 'Sari', 'Tika', 'Ulfa', 'Vina', 'Wulan', 'Yuni', 'Zahra']
nama_belakang = ['Pratama', 'Sari', 'Wijaya', 'Kusuma', 'Santoso', 'Wibowo', 'Lestari', 'Handayani', 'Setiawan', 'Rahayu', 'Permana', 'Utami', 'Saputra', 'Dewi', 'Nugroho', 'Maharani', 'Putra', 'Anggraini', 'Firmansyah', 'Safitri']

tempat_lahir = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Pekalongan', 'Batang', 'Pemalang', 'Tegal', 'Brebes']
agama_list = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']
pendidikan = ['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2']
pekerjaan = ['PNS', 'Swasta', 'Wiraswasta', 'Petani', 'Buruh', 'Guru', 'Dokter', 'Pedagang', 'Sopir', 'Ibu Rumah Tangga']
golongan_darah = ['A', 'B', 'AB', 'O']
status_akademik = ['Aktif', 'Lulus', 'Pindah', 'Keluar']

# Generate 300 students data
students_data = []

print("Generating student records...")

for i in range(300):
    if (i + 1) % 50 == 0:
        print(f"Generated {i + 1} records...")
    
    # Determine gender
    gender = random.choice(['Laki-laki', 'Perempuan'])
    
    # Generate name based on gender
    if gender == 'Laki-laki':
        nama = random.choice(nama_depan_laki) + ' ' + random.choice(nama_belakang)
    else:
        nama = random.choice(nama_depan_perempuan) + ' ' + random.choice(nama_belakang)
    
    # Generate birth date (age 12-16 years)
    birth_year = random.randint(2007, 2011)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)
    birth_date = datetime(birth_year, birth_month, birth_day)
    
    # Generate entry date (usually in July)
    entry_year = birth_year + 12 + random.randint(0, 1)
    entry_date = datetime(entry_year, 7, random.randint(1, 31))
    
    # Generate NIK (16 digits)
    nik = '33' + ''.join([str(random.randint(0, 9)) for _ in range(14)])
    
    # Generate phone numbers
    phone_ayah = '08' + ''.join([str(random.randint(0, 9)) for _ in range(10)])
    phone_ibu = '08' + ''.join([str(random.randint(0, 9)) for _ in range(10)])
    phone_wali = '08' + ''.join([str(random.randint(0, 9)) for _ in range(10)])
    phone_rumah = '0285' + ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    student = {
        'NIS': 2024000 + i + 1,
        'NISN': 3000000000 + i + 1,
        'Nama Siswa': nama,
        'Jenis Kelamin': gender,
        'NIK': nik,
        'Tempat Lahir': random.choice(tempat_lahir),
        'Tanggal Lahir': birth_date.strftime('%d/%m/%Y'),
        'Agama': random.choice(agama_list),
        'Kewarganegaraan': 'Indonesia',
        'Anak Ke-Berapa': random.randint(1, 5),
        'Jumlah Saudara Kandung': random.randint(0, 4),
        'Jumlah Saudara Tiri': random.randint(0, 2),
        'Jumlah Saudara Angkat': random.randint(0, 1),
        'Status Orang Tua': random.choice(['Lengkap', 'Yatim', 'Piatu', 'Yatim Piatu']),
        'Bahasa Sehari-hari Dirumah': random.choice(['Indonesia', 'Jawa', 'Sunda', 'Betawi']),
        'Tempat Tinggal Bersama': random.choice(['Orang Tua', 'Wali', 'Kos', 'Asrama']),
        'Modal Transportasi ke Sekolah': random.choice(['Jalan Kaki', 'Sepeda', 'Motor', 'Angkutan Umum']),
        'Jarak ke Sekolah': str(random.randint(1, 20)) + ' km',
        'Alamat Lengkap': f'Jl. {random.choice(["Merdeka", "Sudirman", "Diponegoro", "Gajah Mada", "Ahmad Yani"])} No. {random.randint(1, 100)}',
        'RT/RW': f'{random.randint(1, 15):03d}/{random.randint(1, 10):03d}',
        'Nama Dusun': random.choice(['Kradenan', 'Bendan', 'Panjang', 'Kauman', 'Klego']),
        'Nama Desa/Kelurahan': random.choice(['Pekalongan Barat', 'Pekalongan Timur', 'Pekalongan Utara', 'Pekalongan Selatan']),
        'Kecamatan': 'Pekalongan Barat',
        'Kode Pos': '51111',
        'No. Telp Rumah': phone_rumah,
        'Kabupaten/Kota': 'Pekalongan',
        'Provinsi': 'Jawa Tengah',
        'Golongan Darah': random.choice(golongan_darah),
        'Penyakit Yang Pernah dI Derita': random.choice(['Tidak Ada', 'Demam Berdarah', 'Tifus', 'Cacar Air', 'Flu']),
        'Penyakit Yang Lain': random.choice(['Tidak Ada', 'Asma', 'Alergi', 'Migrain']),
        'Kelainan Jasmani': random.choice(['Tidak Ada', 'Minus', 'Plus', 'Buta Warna Parsial']),
        'Tinggi Badan': random.randint(140, 170),
        'Berat Badan': random.randint(35, 65),
        'Asal Sekolah (SD/MI)': f'SD Negeri {random.randint(1, 20)} Pekalongan',
        'Tanggal Lulus SD/MI': (birth_date + timedelta(days=365*6)).strftime('%d/%m/%Y'),
        'Nomor Ijazah SD/MI': f'SD{random.randint(100000, 999999)}',
        'Lama Belajar di SD/MI': '6 tahun',
        'Apakah Kamu Siswa Pindahan?': random.choice(['Ya', 'Tidak']),
        'Mulai Kelas Berapa Diterima di SMPN 03 Pekalongan': 'VII',
        'Hari, Tanggal, dan Tahun Diterima di SMPN 03 Pekalongan': entry_date.strftime('%A, %d %B %Y'),
        'Asal Sekolah (SMP/MTS/Sederajat)': '',
        'Alasan Pindah Sekolah': '',
        
        # Data Ayah
        'Nama Ayah  Kandung': random.choice(nama_depan_laki) + ' ' + random.choice(nama_belakang),
        'NIK Ayah': '33' + ''.join([str(random.randint(0, 9)) for _ in range(14)]),
        'Tempat dan Tanggal Lahir Ayah': f'{random.choice(tempat_lahir)}, {random.randint(1, 28)}/{random.randint(1, 12)}/{random.randint(1970, 1990)}',
        'Agama Ayah': random.choice(agama_list),
        'Kewarganegaraan Ayah': 'Indonesia',
        'Pendidikan Terakhir Ayah': random.choice(pendidikan),
        'Pekerjaan Ayah': random.choice(pekerjaan),
        'Penghasilan Bulanan Ayah': f'Rp {random.randint(2, 10)}.000.000',
        'Alamat Lengkap Ayah': f'Jl. {random.choice(["Merdeka", "Sudirman", "Diponegoro"])} No. {random.randint(1, 100)}',
        'Nomor Telepon Ayah': phone_ayah,
        'Status Ayah': random.choice(['Hidup', 'Meninggal']),
        
        # Data Ibu
        'Nama Ibu Kandung': random.choice(nama_depan_perempuan) + ' ' + random.choice(nama_belakang),
        'NIK Ibu': '33' + ''.join([str(random.randint(0, 9)) for _ in range(14)]),
        'Tempat dan Tanggal Lahir Ibu': f'{random.choice(tempat_lahir)}, {random.randint(1, 28)}/{random.randint(1, 12)}/{random.randint(1975, 1995)}',
        'Agama Ibu': random.choice(agama_list),
        'Kewarganegaraan Ibu': 'Indonesia',
        'Pendidikan Terakhir Ibu': random.choice(pendidikan),
        'Pekerjaan Ibu': random.choice(pekerjaan),
        'Penghasilan Bulanan Ibu': f'Rp {random.randint(1, 8)}.000.000',
        'Alamat Lengkap Ibu': f'Jl. {random.choice(["Merdeka", "Sudirman", "Diponegoro"])} No. {random.randint(1, 100)}',
        'Nomor Telepon Ibu': phone_ibu,
        'Status Ibu': random.choice(['Hidup', 'Meninggal']),
        
        # Data Wali
        'Nama Wali': random.choice(nama_depan_laki + nama_depan_perempuan) + ' ' + random.choice(nama_belakang),
        'NIK Wali': '33' + ''.join([str(random.randint(0, 9)) for _ in range(14)]),
        'Tempat dan Tanggal Lahir Wali': f'{random.choice(tempat_lahir)}, {random.randint(1, 28)}/{random.randint(1, 12)}/{random.randint(1970, 1990)}',
        'Agama Wali Murid': random.choice(agama_list),
        'Kewarganegaraan Wali': 'Indonesia',
        'Pendidikan Terakhir Wali': random.choice(pendidikan),
        'Pekerjaan Wali': random.choice(pekerjaan),
        'Penghasilan Bulanan Wali': f'Rp {random.randint(2, 8)}.000.000',
        'Alamat Lengkap Wali': f'Jl. {random.choice(["Merdeka", "Sudirman", "Diponegoro"])} No. {random.randint(1, 100)}',
        'Nomor Telepon Wali': phone_wali,
        'Status Wali': random.choice(['Hidup', 'Meninggal']),
        
        # Bidang Minat
        'Bidang Seni': random.choice(['Musik', 'Tari', 'Lukis', 'Teater', 'Tidak Ada']),
        'Bidang Olahraga': random.choice(['Sepak Bola', 'Basket', 'Voli', 'Badminton', 'Renang', 'Tidak Ada']),
        'Bidang Lain-Lain': random.choice(['Komputer', 'Bahasa', 'Sains', 'Tidak Ada']),
        
        # Prestasi
        'Apakah Peserta Didik Pernah Meraih Prestasi?': random.choice(['Ya', 'Tidak']),
        'Jenis Prestasi': random.choice(['Akademik', 'Non-Akademik', '']),
        'Tingkat Prestasi': random.choice(['Sekolah', 'Kecamatan', 'Kabupaten', 'Provinsi', '']),
        'Nama Prestasi': random.choice(['Juara 1 Matematika', 'Juara 2 IPA', 'Juara 3 Bahasa Indonesia', '']),
        'Tahun Prestasi': random.choice(['2023', '2024', '']),
        'Penyelenggara': random.choice(['SMPN 03 Pekalongan', 'Dinas Pendidikan', '']),
        'Peringkat': random.choice(['1', '2', '3', '']),
        
        # Prestasi 2-5 (mostly empty)
        'Lanjut Ke-Prestasi 2': random.choice(['Ya', 'Tidak', '']),
        'Jenis Prestasi (2)': '',
        'Tingkat Prestasi (2)': '',
        'Nama Prestasi (2)': '',
        'Tahun Prestasi (2)': '',
        'Penyelenggara (2)': '',
        'Peringkat (2)': '',
        'Lanjut Ke-Prestasi 3': '',
        'Jenis Prestasi (3)': '',
        'Tingkat Prestasi (3)': '',
        'Nama Prestasi (3)': '',
        'Tahun Prestasi (3)': '',
        'Penyelenggara (3)': '',
        'Peringkat (3)': '',
        'Lanjut Ke-Prestasi 4': '',
        'Jenis Prestasi (4)': '',
        'Tingkat Prestasi (4)': '',
        'Nama Prestasi (4)': '',
        'Tahun Prestasi (4)': '',
        'Penyelenggara (4)': '',
        'Peringkat (4)': '',
        'Lanjut Ke-Prestasi 5': '',
        'Jenis Prestasi (5)': '',
        'Tingkat Prestasi (5)': '',
        'Nama Prestasi (5)': '',
        'Tahun Prestasi (5)': '',
        'Penyelenggara (5)': '',
        'Peringkat (5)': '',
        
        # Beasiswa
        'Apakah Peserta Didik Memiliki Beasiswa': random.choice(['Ya', 'Tidak']),
        'Jenis Beasiswa': random.choice(['KIP', 'Prestasi', 'Tidak Ada']),
        'Keterangan': random.choice(['Beasiswa penuh', 'Beasiswa parsial', '']),
        'Tahun Mulai': random.choice(['2024', '2023', '']),
        'Tahun Selesai': random.choice(['2027', '2026', '']),
        
        # Beasiswa 2-3 (mostly empty)
        'Lanjut Ke-Beasiswa 2': '',
        'Jenis Beasiswa (2)': '',
        'Keterangan (2)': '',
        'Tahun Mulai (2)': '',
        'Tahun Selesai (2)': '',
        'Lanjut Ke-Beasiswa 3': '',
        'Jenis Beasiswa (3)': '',
        'Keterangan (3)': '',
        'Tahun Mulai (3)': '',
        'Tahun Selesai (3)': '',
        
        'Status Akademik': random.choice(status_akademik)
    }
    
    students_data.append(student)

print(f"Generated {len(students_data)} student records")

# Create DataFrame
df = pd.DataFrame(students_data)

print("Creating Excel file...")

# Save to Excel file
file_path = r'd:\VSCode Data\magang\web\admin_dashboard\Data Peserta Didik SMPN 03 Pekalongan.xlsx'
df.to_excel(file_path, index=False, sheet_name='DATA SISWA')

print(f'Successfully created {len(students_data)} student records and saved to {file_path}')
print(f'Total columns: {len(df.columns)}')
print(f'Sample data for first student:')
print(f'NIS: {df.iloc[0]["NIS"]}')
print(f'Name: {df.iloc[0]["Nama Siswa"]}')
print(f'Gender: {df.iloc[0]["Jenis Kelamin"]}')
print(f'Status: {df.iloc[0]["Status Akademik"]}')
print(f'\nStatus Akademik distribution:')
print(df['Status Akademik'].value_counts())