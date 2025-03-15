import os
import math
from tabula import read_pdf

path = "P:/Mes documents/JW/Compta Sartrouville/Clef/Comptes Sartrouville/"

def convert_to_float(value):
    if isinstance(value, str):
        try:
            return float(value.replace(",", ".").replace(" ", ""))
        except:
            return 0.0
    if math.isnan(value):
        return 0.0

    return value

def calcule_offr(df_offr):
    total_offrandes = 0.0
    codes = ["E01", "F06"]
    offr = df_offr[df_offr.CODE.isin(codes)]          
    offr.reset_index(drop=True, inplace=True)

    for index, row in offr.iterrows():
        if(row.CODE == "E01"):
            total_offrandes = total_offrandes + convert_to_float(row.EEntree)
        if(row.CODE == "F06"):
            total_offrandes = total_offrandes + convert_to_float(row.SEntree)

    return total_offrandes

def calcule_dep(df_dep):
    total_depenses = 0.0
    codes = []
    for i in range(1, 100):
        codes.append("D" + str(i).zfill(2))
    codes.append("V03")

    dep = df_dep[df_dep.CODE.isin(codes)]     
    dep.reset_index(drop=True, inplace=True)

    for index, row in dep.iterrows():
        total_depenses = total_depenses + convert_to_float(row.ESortie) 
        total_depenses = total_depenses + convert_to_float(row.PSortie) 
        total_depenses = total_depenses + convert_to_float(row.SSortie)

    return total_depenses

def read_pdf_file(file):
    df = read_pdf(file, pages="all", lattice = True, silent=True)
    df = df[0]
    df.drop(index=df.index[0], axis=0, inplace=True)
    df.astype(str).fillna("0.0")
    df.rename(columns={"ENCAISSEMENTS": "EEntree", "CO": "CODE", "COMPTE PRINCIPAL": "ESortie", "COMPTE SECONDAIRE" : "PEntree", "Unnamed: 0" : "PSortie", "Unnamed: 1" : "SEntree", "Unnamed: 2" : "SSortie" }, inplace=True)
    offr = calcule_offr(df.copy())
    dep = calcule_dep(df.copy())
    filename = os.path.basename(file)
    print(filename + ";" + filename[-10:-8]+"/"+ filename[-8:-4] + ";" + str(offr).replace(".", ",") + ";" + str(dep).replace(".", ","))
    return 
 
def main():
    list_s26 = [os.path.join(root, name)
             for root, dirs, files in os.walk(path)
             for name in files
             if name.startswith("S26")]   

    print(len(list_s26))

    for f in list_s26:
        read_pdf_file(f)

if __name__ == "__main__":
    main()




