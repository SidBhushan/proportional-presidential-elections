import csv

threshold = 0.1 # 1 = 100%, 0.5 = 50%, etc.

with open('input.csv', 'r') as input_csv_file:
    reader = csv.DictReader(input_csv_file)
    output_csv_file = open('output.json', 'w')
    writer = csv.DictWriter(output_csv_file, ['year', 'state_po', 'candidate', 'party', 'candidatevotes', 'totalvotes', 'portionvotes'])
    writer.writerow({
        'year': 'year',
        'state_po': 'state_po',
        'candidate': 'candidate',
        'party': 'party',
        'candidatevotes': 'candidatevotes',
        'totalvotes': 'totalvotes',
        'portionvotes': 'portionvotes'
    })
    for row in reader:
        portionvotes = float(row['candidatevotes']) / float(row['totalvotes'])
        if portionvotes > threshold:
            writer.writerow({
                'year': row['year'],
                'state_po': row['state_po'],
                'candidate': row['candidate'],
                'party': row['party'],
                'candidatevotes': row['candidatevotes'],
                'totalvotes': row['totalvotes'],
                'portionvotes': portionvotes
            })
