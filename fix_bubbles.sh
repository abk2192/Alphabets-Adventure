# 1. Update floatBubble animation to be forwards and not infinite
sed -i 's/animation: floatBubble 12s infinite ease-in-out;/animation: floatBubble 12s ease-in-out forwards;/' styles.css
