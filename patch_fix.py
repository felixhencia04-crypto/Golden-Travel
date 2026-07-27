with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

import re

# We want to replace the extra </div>s
# Currently it looks like:
#                </div>
#              </div>
#              </div>
#              </div>
#            </div>
#          )}

fixed_end = """                </div>
              </div>
            </div>
          )}"""

content = re.sub(r'                </div>\n              </div>\n              </div>\n              </div>\n            </div>\n          \)}', fixed_end, content)

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
print("Done")
