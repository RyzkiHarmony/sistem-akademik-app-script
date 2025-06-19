import pandas as pd

try:
    df = pd.read_excel('Data Peserta Didik SMPN 03 Pekalongan.xlsx')
    print('NIS range:', df['NIS'].min(), '-', df['NIS'].max())
    print('Total students:', len(df))
    print('Sample NIS values:', df['NIS'].head(10).tolist())
    
    # Check if NIS 2046 exists
    nis_2046_exists = 2046 in df['NIS'].values
    print('NIS 2046 exists:', nis_2046_exists)
    
    if nis_2046_exists:
        student_2046 = df[df['NIS'] == 2046]
        print('Student with NIS 2046:')
        print(student_2046[['NIS', 'Nama Siswa', 'Status Akademik']].to_string())
    else:
        print('NIS 2046 not found in data')
        
except Exception as e:
    print('Error:', str(e))