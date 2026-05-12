document.getElementById('convertBtn').addEventListener('click', function() {
            const input = document.getElementById('pngInput');
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = function() {
                        const gif = new GIF({
                            workers: 2,
                            quality: 10
                        });

                        gif.addFrame(img, {delay: 200});
                        gif.on('finished', function(blob) {
                            const gifURL = URL.createObjectURL(blob);
                            document.getElementById('gifOutput').src = gifURL;
                        });

                        gif.render();
                    }
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                alert("Please select a PNG file.");
            }
        });