#!/bin/bash

FILE="src/frontend/src/components/ShareDialog.js"

# 1. Aggiungere useContext all'import React
sed -i 's/import React, { useState, useEffect }/import React, { useState, useEffect, useContext }/' "$FILE"

# 2. Aggiungere import AuthContext dopo gli import esistenti
sed -i '/} from '\''@mui\/icons-material'\'';/a import { AuthContext } from '\''../context/AuthContext'\'';' "$FILE"

# 3. Aggiungere const { token } dopo gli useState
sed -i '/const \[snackbarMessage, setSnackbarMessage\]/a \ \ const { token } = useContext(AuthContext);' "$FILE"

echo "Modifiche applicate a $FILE"
