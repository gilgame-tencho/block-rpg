echo "*#*#*#*#*#*#* START OBACHAN *#*#*#*#*#*#*"

echo "START BUILD"
node build/commonClass.js

echo "START SERVER"
#node index.js
nodemon index.js
