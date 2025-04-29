from bs4 import BeautifulSoup


def simplify_html(html_content):
    """
    Simplifies HTML by removing unnecessary nested <div> tags, redundant classes, inline styles, custom tags,
    excessive newlines, unnecessary spaces, and <span> tags. Produces compact inline formatting.
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove all <div> tags but keep their content
    for div in soup.find_all('div'):
        div.unwrap()

    # Remove all <span> tags but keep their content
    for span in soup.find_all('span'):
        span.unwrap()

    # Remove redundant classes and inline styles
    for tag in soup.find_all(True):  # Iterate over all tags
        if 'class' in tag.attrs:
            del tag.attrs['class']
        if 'style' in tag.attrs:
            del tag.attrs['style']

    # Minimize excessive newlines and unnecessary spaces
    simplified_html = soup.prettify(formatter="minimal")
    # Compact into a single line
    simplified_html = " ".join(simplified_html.split())
    simplified_html = simplified_html.replace(
        " <", "<")  # Remove spaces between tags
    # Remove spaces between tags, but not after </strong>
    simplified_html = simplified_html.replace(
        "> ", ">")  # Remove spaces between tags
    simplified_html = simplified_html.replace(
        "</strong>", "</strong> ")  # Preserve space after </strong>

    return simplified_html


# Example usage
if __name__ == "__main__":
    html_input = """
    <p><em>You declare yourself to wield the power of the storm, touching a small ball of crumbled metal foil. The ball electrifies, and as you pull your hand away, a congruent ball of lightning appears in your hand, which you fling at an enemy. As you move your hand to mimic a ball bouncing, the ball then bounces to a creature of your choice close to the first.</em></p>
    <p><strong>Dexterity Save</strong></p>
    <p>This spell can affect 2 creatures* within 15 ft. of each other. The first must be within 30 ft. of you.</p>
    <ul>
        <li><p><strong>Failure:</strong> Target takes [[/damage 2d8 lightning]] damage.</p></li>
        <li><p><strong>Success:</strong> Half damage.</p></li>
    </ul>
    <p><strong>*Upcasting:</strong> The ball can bounce to an additional target within 15 ft. of your last target for each spell level above 1st.</p>
    """
    simplified_html = simplify_html(html_input)
    print(simplified_html)
