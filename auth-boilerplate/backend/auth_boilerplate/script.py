import csv
from django.contrib.auth.models import User

# Path to your CSV file
csv_path = "teams.csv"

with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    count = 0
    for row in reader:
        username = row['username'].strip()
        email = row['email'].strip()
        password = row['password'].strip()

        # Check if user already exists
        if not User.objects.filter(username=username).exists():
            User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            count += 1
            print(f"✅ Created user: {username}")
        else:
            print(f"⚠️ Skipped (already exists): {username}")

print(f"\n🎉 Done! Total users created: {count}")
