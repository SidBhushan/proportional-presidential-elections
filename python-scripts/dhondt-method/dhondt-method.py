import numpy
import csv

state_data = {}
with open('state_data.csv', 'r') as state_data_csv:
    state_data_csv_reader = csv.DictReader(state_data_csv)
    for entry in state_data_csv_reader:
        if entry["year"] not in state_data:
            state_data[entry["year"]] = {}
        if entry["name"] not in state_data[entry["year"]]:
            state_data[entry["year"]][entry["name"]] = {}
        state_data[entry["year"]][entry["name"]] = {
            "electors": int(entry["electors"])
        }


class Election:
    def __init__(self, year):
        self.states = []
        self.year = year

    def add_state(self, candidates, state_name):
        state_candidates = []
        for candidate in candidates:
            state_candidates.append({
                "name": candidate["candidate"],
                "votes": int(candidate["candidatevotes"]),
                "party": candidate["party"],
                "electors": 0
            })
        state_candidates = Election.dhondt_candidates(state_candidates, Election.get_electors(self.year, state_name))
        self.states.append({
            "name": state_name,
            "electors": Election.get_electors(self.year, state_name),
            "candidates": state_candidates
        })


    @staticmethod
    def get_electors(year, state_name):
        return state_data[year][state_name]["electors"]

    @staticmethod
    def dhondt_candidates(candidates, total_electors):
        def biggest_in_matrix(mat):
            result = numpy.where(mat == numpy.amax(mat))
            coordinates = list(zip(result[0], result[1]))[0]
            return coordinates
        matrix = []
        for candidate_index in range(len(candidates)):
            matrix.append([])
            for divisor in range(1, total_electors + 1):
                matrix[candidate_index].append(
                    candidates[candidate_index]["votes"] / divisor
                )
        results = []
        for candidate in candidates:
            results.append({
                "name": candidate["name"],
                "votes": candidate["votes"],
                "party": candidate["party"],
                "electors": 0
            })
        while sum(map(lambda result: result["electors"], results)) < total_electors:
            coordinates = biggest_in_matrix(matrix)
            results[coordinates[0]]["electors"] += 1
            matrix[coordinates[0]][coordinates[1]] = -1
        return results


if __name__ == '__main__':
    # Election.dhondt_candidates([{
    #     "name": "A",
    #     "votes": 100_000
    # }, {
    #     "name": "B",
    #     "votes": 80_000
    # }, {
    #     "name": "C",
    #     "votes": 30_000
    # }, {
    #     "name": "D",
    #     "votes": 20_000
    # }
    # ], 8)
    # print(state_data)

    output_csv = open('output.json', 'w')
    output_csv_writer = csv.DictWriter(output_csv, ["year", "state_po", "candidate", "party", "electors"])
    output_csv_writer.writerow({
        "year": "year",
        "state_po": "state_po",
        "candidate": "candidate",
        "party": "party",
        "electors": "electors"
    })
    years = list(map(lambda year: str(year), range(1976, 2020, 4)))
    for year in years:
        election = Election(year)
        candidates = {}
        with open("input.csv", 'r') as input_csv:
            input_csv_reader = csv.DictReader(input_csv)
            for row in input_csv_reader:
                if row["year"] == year:
                    if row["state_po"] not in candidates:
                        candidates[row["state_po"]] = []
                    candidates[row["state_po"]].append(row)

            for key in candidates.keys():
                election.add_state(candidates[key], key)

            for state in election.states:
                candidates = state["candidates"]
                for candidate in candidates:
                    output_csv_writer.writerow({
                        "year": election.year,
                        "state_po": state["name"],
                        "candidate": candidate["name"],
                        "party": candidate["party"],
                        "electors": candidate["electors"]
                    })
