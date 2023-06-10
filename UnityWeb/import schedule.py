import schedule
import time

def main():
    bot = Bot()
    bot.login(username="your_username", password="your_password")

    image_folder = "path/to/your/image/folder"
    image_list = os.listdir(image_folder)

    random_image = random.choice(image_list)
    image_path = os.path.join(image_folder, random_image)
    bot.upload_photo(image_path, caption="Your caption here")

# Schedule the script to run at 12 PM every day
schedule.every().day.at("12:00").do(main)

while True:
    schedule.run_pending()
    time.sleep(60)
