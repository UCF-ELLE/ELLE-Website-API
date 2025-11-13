import os
USER_VOICE_FOLDER = "../user_audio_files/"

def cleanup_old_combined_useraudio_files():
    for class_id in os.listdir(USER_VOICE_FOLDER):
        class_path = os.path.join(USER_VOICE_FOLDER, class_id)
        if not os.path.isdir(class_path):
            continue

        for module_id in os.listdir(class_path):
            module_path = os.path.join(class_path, module_id)
            if not os.path.isdir(module_path):
                continue

            for user_id in os.listdir(module_path):
                user_path = os.path.join(module_path, user_id)
                if not os.path.isdir(user_path):
                    continue

                # Build the target file path
                target_file = os.path.abspath(os.path.join(user_path, f"{user_id}.webm"))
                if os.path.isfile(target_file):
                    os.remove(target_file)
                    print(f"Deleted: {target_file}")
                # else:
                    # print(f"File not found: {target_file}")
    return