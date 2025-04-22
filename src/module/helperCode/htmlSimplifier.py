from bs4 import BeautifulSoup

def simplify_html(html_content):
    """
    Simplifies HTML by removing unnecessary nested <div> tags, redundant classes, inline styles, custom tags,
    excessive newlines, and unnecessary spaces. Produces compact inline formatting.
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove all <div> tags but keep their content
    for div in soup.find_all('div'):
        div.unwrap()

    # Remove redundant classes and inline styles
    for tag in soup.find_all(True):  # Iterate over all tags
        if 'class' in tag.attrs:
            del tag.attrs['class']
        if 'style' in tag.attrs:
            del tag.attrs['style']

    # Minimize excessive newlines and unnecessary spaces
    simplified_html = soup.prettify(formatter="minimal")
    simplified_html = " ".join(simplified_html.split())  # Compact into a single line
    simplified_html = simplified_html.replace(" <", "<")  # Remove spaces between tags
    # Remove spaces between tags, but not after </strong>
    simplified_html = simplified_html.replace("> ", ">")  # Remove spaces between tags
    simplified_html = simplified_html.replace("</strong>", "</strong> ")  # Preserve space after </strong>

    return simplified_html

# Example usage
if __name__ == "__main__":
    html_input = """
    <p>
        <span style="font-family:Signika, sans-serif">
            <em style="box-sizing:border-box;user-select:text">
                Holding a small reflective black stone in your palm, you curse your target, who appears in the reflection of the stone. You attempt to strip them of the energy empowering them, whether it be biological, magical, or psychological.
            </em>
        </span>
    </p>
    <p>
        <strong>Charisma Save</strong>
    </p>
    <ul>
        <li>
            <p>
                <strong>Failure:</strong> Target loses all &reference[temporary hit points].
            </p>
        </li>
        <li>
            <p>
                <strong>Success:</strong> Target loses half of their temporary hit points.
            </p>
        </li>
    </ul>
    <p></p>
    <p>
        <strong>Upcasting:</strong> Target one additional creature for each spell level above 1st.
    </p>
    <p></p>
    <p>
        <em>This spell counts as a &reference[cursed]{curse}.</em>
    </p>
    """
    simplified_html = simplify_html(html_input)
    print(simplified_html)
