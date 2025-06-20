import pandas as pd
import openpyxl
from openpyxl import load_workbook
import json

def analyze_data_nilai_structure(file_path, sheet_name="DATA NILAI"):
    """
    Menganalisis struktur sheet DATA NILAI dan memberikan mapping yang tepat
    """
    try:
        # Load workbook
        workbook = load_workbook(file_path, read_only=True)
        
        if sheet_name not in workbook.sheetnames:
            print(f"Sheet '{sheet_name}' tidak ditemukan.")
            print(f"Sheet yang tersedia: {workbook.sheetnames}")
            return None
        
        worksheet = workbook[sheet_name]
        
        # Baca headers
        headers = []
        for cell in worksheet[1]:
            if cell.value is not None:
                headers.append(str(cell.value).strip())
            else:
                break
        
        workbook.close()
        
        # Analisis struktur
        analysis = {
            'total_columns': len(headers),
            'headers': headers,
            'basic_info': {},
            'subjects': [],
            'subject_scores': [],
            'ujian_sekolah': [],
            'capaian_pembelajaran': [],
            'other_fields': []
        }
        
        # Identifikasi kolom-kolom penting
        for i, header in enumerate(headers):
            header_lower = header.lower()
            
            # Basic info
            if header_lower == 'timestamp':
                analysis['basic_info']['timestamp'] = {'index': i, 'header': header}
            elif header_lower == 'nama siswa':
                analysis['basic_info']['nama'] = {'index': i, 'header': header}
            elif header_lower == 'nis':
                analysis['basic_info']['nis'] = {'index': i, 'header': header}
            elif header_lower == 'nisn':
                analysis['basic_info']['nisn'] = {'index': i, 'header': header}
            elif header_lower == 'kelas':
                analysis['basic_info']['kelas'] = {'index': i, 'header': header}
            elif header_lower == 'semester':
                analysis['basic_info']['semester'] = {'index': i, 'header': header}
            elif header_lower == 'tahun ajaran':
                analysis['basic_info']['tahunAjaran'] = {'index': i, 'header': header}
            
            # Mata pelajaran dengan nilai
            elif header in ['Pendidikan Agama Islam', 'Pendidikan Pancasila', 'Bahasa Indonesia', 
                          'Matematika', 'Ilmu Pengetahuan Alam', 'Ilmu Pengetahuan Sosial',
                          'Bahasa Inggris', 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
                          'Informatika', 'Seni Budaya', 'Bimbingan dan Konseling', 'Bahasa Jawa']:
                analysis['subject_scores'].append({'index': i, 'header': header, 'subject': header})
            
            # Ujian Sekolah
            elif '- ujian sekolah' in header_lower:
                subject = header.replace(' - Ujian Sekolah', '')
                analysis['ujian_sekolah'].append({'index': i, 'header': header, 'subject': subject})
            
            # Capaian Pembelajaran
            elif header.startswith('Capaian Pembelajaran'):
                analysis['capaian_pembelajaran'].append({'index': i, 'header': header})
            
            # Fields lainnya
            elif any(keyword in header_lower for keyword in ['sakit', 'izin', 'tanpa keterangan', 
                    'naik', 'prestasi', 'ekstrakurikuler', 'projek', 'elemen']):
                analysis['other_fields'].append({'index': i, 'header': header})
        
        return analysis
    
    except Exception as e:
        print(f"Error: {e}")
        return None

def generate_code_js_mapping(analysis):
    """
    Generate mapping untuk code.js berdasarkan analisis
    """
    if not analysis:
        return None
    
    mapping = {
        'gradeColumnMap': {},
        'subjectColumns': [],
        'ujianSekolahColumns': [],
        'capaianPembelajaranColumns': []
    }
    
    # Basic info mapping
    for field, info in analysis['basic_info'].items():
        mapping['gradeColumnMap'][field] = [info['header']]
    
    # Subject columns
    for subject_info in analysis['subject_scores']:
        mapping['subjectColumns'].append({
            'name': subject_info['subject'],
            'header': subject_info['header'],
            'index': subject_info['index']
        })
    
    # Ujian Sekolah columns
    for ujian_info in analysis['ujian_sekolah']:
        mapping['ujianSekolahColumns'].append({
            'subject': ujian_info['subject'],
            'header': ujian_info['header'],
            'index': ujian_info['index']
        })
    
    # Capaian Pembelajaran columns
    for capaian_info in analysis['capaian_pembelajaran']:
        mapping['capaianPembelajaranColumns'].append({
            'header': capaian_info['header'],
            'index': capaian_info['index']
        })
    
    return mapping

def save_analysis_report(analysis, mapping, output_file="data_nilai_analysis.txt"):
    """
    Simpan laporan analisis ke file
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("=== ANALISIS STRUKTUR SHEET DATA NILAI ===\n\n")
        
        f.write(f"Total kolom: {analysis['total_columns']}\n\n")
        
        # Basic Info
        f.write("=== INFORMASI DASAR SISWA ===\n")
        for field, info in analysis['basic_info'].items():
            f.write(f"{field}: {info['header']} (kolom {info['index'] + 1})\n")
        f.write("\n")
        
        # Subject Scores
        f.write("=== MATA PELAJARAN DENGAN NILAI ===\n")
        for i, subject in enumerate(analysis['subject_scores'], 1):
            f.write(f"{i:2d}. {subject['subject']} (kolom {subject['index'] + 1})\n")
        f.write("\n")
        
        # Ujian Sekolah
        f.write("=== NILAI UJIAN SEKOLAH ===\n")
        for i, ujian in enumerate(analysis['ujian_sekolah'], 1):
            f.write(f"{i:2d}. {ujian['subject']} - Ujian Sekolah (kolom {ujian['index'] + 1})\n")
        f.write("\n")
        
        # Code.js mapping
        f.write("=== MAPPING UNTUK CODE.JS ===\n\n")
        
        f.write("// Update initializeGradeColumnMap function:\n")
        f.write("function initializeGradeColumnMap() {\n")
        f.write("  return {\n")
        for field, headers in mapping['gradeColumnMap'].items():
            f.write(f'    {field}: {json.dumps(headers)},\n')
        f.write("  };\n")
        f.write("}\n\n")
        
        f.write("// Mata pelajaran yang tersedia:\n")
        f.write("const availableSubjects = [\n")
        for subject in mapping['subjectColumns']:
            f.write(f'  "{subject["name"]}",\n')
        f.write("];\n\n")
        
        f.write("// Mapping kolom mata pelajaran:\n")
        f.write("const subjectColumnMapping = {\n")
        for subject in mapping['subjectColumns']:
            safe_key = subject['name'].replace(' ', '_').replace(',', '').replace('.', '')
            f.write(f'  "{safe_key}": "{subject["header"]}",\n')
        f.write("};\n\n")
        
        f.write("// Struktur data yang diharapkan:\n")
        f.write("// Setiap baris data akan memiliki struktur:\n")
        f.write("// {\n")
        for field in mapping['gradeColumnMap'].keys():
            f.write(f'//   {field}: "nilai dari kolom {field}",\n')
        for subject in mapping['subjectColumns'][:5]:  # Tampilkan 5 mata pelajaran pertama
            safe_key = subject['name'].replace(' ', '_').replace(',', '').replace('.', '')
            f.write(f'//   {safe_key}: "nilai {subject["name"]}",\n')
        f.write("//   ...\n")
        f.write("// }\n")

def main():
    excel_file = "Data Peserta Didik SMPN 03 Pekalongan (3).xlsx"
    
    print(f"Menganalisis struktur file: {excel_file}")
    print(f"Sheet: DATA NILAI\n")
    
    # Analisis struktur
    analysis = analyze_data_nilai_structure(excel_file)
    
    if analysis:
        print(f"✓ Berhasil menganalisis {analysis['total_columns']} kolom")
        print(f"✓ Ditemukan {len(analysis['basic_info'])} field informasi dasar")
        print(f"✓ Ditemukan {len(analysis['subject_scores'])} mata pelajaran dengan nilai")
        print(f"✓ Ditemukan {len(analysis['ujian_sekolah'])} nilai ujian sekolah")
        print(f"✓ Ditemukan {len(analysis['capaian_pembelajaran'])} capaian pembelajaran")
        
        # Generate mapping
        mapping = generate_code_js_mapping(analysis)
        
        # Simpan laporan
        output_file = "data_nilai_analysis.txt"
        save_analysis_report(analysis, mapping, output_file)
        print(f"\n✓ Laporan analisis disimpan ke: {output_file}")
        
        # Tampilkan ringkasan
        print("\n=== RINGKASAN STRUKTUR ===\n")
        print("Informasi Dasar Siswa:")
        for field, info in analysis['basic_info'].items():
            print(f"  - {field}: {info['header']}")
        
        print(f"\nMata Pelajaran ({len(analysis['subject_scores'])} total):")
        for subject in analysis['subject_scores'][:10]:  # Tampilkan 10 pertama
            print(f"  - {subject['subject']}")
        if len(analysis['subject_scores']) > 10:
            print(f"  ... dan {len(analysis['subject_scores']) - 10} lainnya")
        
    else:
        print("❌ Gagal menganalisis struktur file")

if __name__ == "__main__":
    main()