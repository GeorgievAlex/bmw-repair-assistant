# Repair notes template

This is for the E90 325i (N52B25) repair helper project. Fill in one row per repair job you know well, same shape as the two example rows already in the file (oil change, front brake pads). Open `repair-template.csv` in Google Sheets, Excel, or Numbers, it's a normal spreadsheet.

## Columns

- **procedure_name** — short name, e.g. "Rear brake pad replacement"
- **chassis** — E90 unless you're covering a different one
- **engine_code** — N52B25 unless it's a different engine variant
- **category** — Engine, Brakes, Suspension, Electrical, Cooling, etc., whatever groups make sense to you
- **summary** — one sentence on what the job is
- **steps** — numbered steps, doesn't need to be exhaustive, just enough that someone who's done basic work before can follow it
- **torque_specs** — every bolt/fastener you'd actually torque, with the Nm value. Format: `Bolt name: value Nm; Next bolt: value Nm`
- **part_numbers** — OEM part numbers for anything you'd order, with a short description. Same `name: number; name: number` format
- **tools_needed** — anything beyond a basic socket set
- **difficulty** — Easy / Medium / Hard
- **time_estimate** — roughly how long it takes you
- **notes_warnings** — the stuff that actually matters, what people get wrong, what breaks if you're not careful, anything you wish you'd known the first time
- **source** — just put "my own experience" or wherever you'd actually trust this number from. This isn't for anyone else to check, it's so we know later which entries are solid vs. a rough guess.

## How many

However many you've got time for. 10-15 real jobs, the ones you actually get asked about or do most often, is plenty for a first version. Doesn't need to be comprehensive, just real and accurate. If you only have time for 5, send 5.

## Important

Everything in here should come from what you actually know, not copied out of a manual or PDF. Your own knowledge and experience is exactly what makes this useful, and it's the only kind of input we can safely use for this project (long story, ask if curious).
