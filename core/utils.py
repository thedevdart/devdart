import base64
import os
from io import BytesIO
from PIL import Image
from pypdf import PdfReader, PdfWriter
from django.core.files.base import ContentFile

def compress_base64_if_needed(mime_type, b64_data, max_size=1024 * 1024):
    """
    Compresses a base64 encoded image or PDF if it exceeds `max_size`.
    Returns the (possibly new) mime_type and the compressed base64 string.
    """
    try:
        raw_data = base64.b64decode(b64_data)
    except Exception:
        return mime_type, b64_data
        
    if len(raw_data) < max_size:
        return mime_type, b64_data

    if mime_type in ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/jpg']:
        try:
            with Image.open(BytesIO(raw_data)) as img:
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                output = BytesIO()
                quality = 85
                img.save(output, format='JPEG', quality=quality)
                
                while output.tell() >= max_size and quality > 15:
                    quality -= 10
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=quality)
                
                if output.tell() >= max_size:
                    scale = 0.8
                    while output.tell() >= max_size and scale > 0.3:
                        new_size = (int(img.width * scale), int(img.height * scale))
                        resized_img = img.resize(new_size, getattr(Image, 'Resampling', Image).LANCZOS)
                        output = BytesIO()
                        resized_img.save(output, format='JPEG', quality=quality)
                        scale -= 0.1

                if output.tell() < len(raw_data):
                    return 'image/jpeg', base64.b64encode(output.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"Error compressing base64 image: {e}")

    elif mime_type == 'application/pdf':
        try:
            reader = PdfReader(BytesIO(raw_data))
            writer = PdfWriter()
            
            for page in reader.pages:
                writer.add_page(page)
            
            for page in writer.pages:
                if hasattr(page, 'compress_content_streams'):
                    page.compress_content_streams()

            if hasattr(writer, 'compress_identical_objects'):
                writer.compress_identical_objects()

            for page in writer.pages:
                if hasattr(page, 'images'):
                    for img in page.images:
                        if hasattr(img, 'replace'):
                            try:
                                img.replace(img.image, quality=60)
                            except Exception:
                                pass
                
            output = BytesIO()
            writer.write(output)
            
            if output.tell() < len(raw_data):
                return 'application/pdf', base64.b64encode(output.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"Error compressing base64 PDF: {e}")

    return mime_type, b64_data

def compress_file_if_needed(file_field, max_size=1024 * 1024):
    """
    Compresses an image or PDF if it exceeds `max_size` (default 1MB).
    This function modifies the file_field in place.
    """
    if not file_field or not file_field.name:
        return

    # Check if the file is already committed (i.e. already saved in DB and storage).
    # We only want to compress newly uploaded files.
    if getattr(file_field, '_committed', True):
        return

    try:
        if file_field.size < max_size:
            return
    except Exception:
        return

    ext = os.path.splitext(file_field.name)[1].lower()

    if ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp']:
        try:
            file_field.open()
            with Image.open(file_field) as img:
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                output = BytesIO()
                quality = 85
                img.save(output, format='JPEG', quality=quality)
                
                while output.tell() >= max_size and quality > 15:
                    quality -= 10
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=quality)
                
                if output.tell() >= max_size:
                    scale = 0.8
                    while output.tell() >= max_size and scale > 0.3:
                        new_size = (int(img.width * scale), int(img.height * scale))
                        resized_img = img.resize(new_size, getattr(Image, 'Resampling', Image).LANCZOS)
                        output = BytesIO()
                        resized_img.save(output, format='JPEG', quality=quality)
                        scale -= 0.1

                if output.tell() < file_field.size:
                    new_name = os.path.splitext(file_field.name)[0] + '.jpg'
                    # file_field.save saves the file to storage immediately and sets _committed=True
                    file_field.save(new_name, ContentFile(output.getvalue()), save=False)
        except Exception as e:
            print(f"Error compressing image {file_field.name}: {e}")
        finally:
            file_field.close()

    elif ext == '.pdf':
        try:
            file_field.open()
            reader = PdfReader(file_field)
            writer = PdfWriter()
            
            for page in reader.pages:
                writer.add_page(page)
            
            for page in writer.pages:
                if hasattr(page, 'compress_content_streams'):
                    page.compress_content_streams()

            if hasattr(writer, 'compress_identical_objects'):
                writer.compress_identical_objects()

            for page in writer.pages:
                if hasattr(page, 'images'):
                    for img in page.images:
                        if hasattr(img, 'replace'):
                            try:
                                img.replace(img.image, quality=60)
                            except Exception:
                                pass
                
            output = BytesIO()
            writer.write(output)
            
            if output.tell() < file_field.size:
                file_field.save(file_field.name, ContentFile(output.getvalue()), save=False)
        except Exception as e:
            print(f"Error compressing PDF {file_field.name}: {e}")
        finally:
            file_field.close()
