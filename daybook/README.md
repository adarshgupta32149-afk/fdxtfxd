# Daybook

A sales and purchases day book. Separate from the Automech site in the repository root: it only
lives in this `daybook/` folder and has its own Supabase project.

## Using it

Open `daybook/index.html` in a browser (or `/daybook/` on wherever this repository is hosted).

1. **Create account** with a username and password. Each account is its own private book.
2. Pick **Sale** or **Purchase**, type the item and the price, press Enter. The date and time are stamped automatically.
3. Entries stack onto the day's sheet. The day sheets stack into the month (the 1 to 30 strip shows which days have entries).
4. **Download Excel file** turns the month into one `.xlsx` with a row for every day, plus sheets for all entries, sales and purchases. **Download CSV** gives the plain entry list.

Other things it does: remembers item names and their last price, backdates an entry (tap an empty day or
"Change date or add a note"), edits and deletes entries, switches between months, changes the currency symbol.

## How the data is kept apart

- Supabase project: `ledger-tracker` (`vkzykysabyrxygdgqseq`, region ap-south-1).
- Every row in `entries` carries the owner's `user_id`. Row-level security only lets an account
  read, add, change or delete rows where `user_id` is its own. The key in `index.html` is the public
  key and cannot get around that.
- Accounts are username + password. The `signup` edge function creates them as
  `<username>@daybook.local`, so no email is sent. There is no email password reset: a signed-in
  user can change their password from the account menu, and the project owner can reset one from
  the Supabase dashboard (Authentication, Users).

## Files

- `index.html`: the whole app (one file).
- `supabase/migrations/001_daybook_schema.sql`: tables, security rules and the month totals function.
- `supabase/functions/signup/index.ts`: the account creation function.
