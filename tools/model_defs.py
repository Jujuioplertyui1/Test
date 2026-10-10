"""Shared model definitions: used to write Bedrock geometry JSON and to paint matching textures.

Coordinates follow Bedrock geometry conventions (pixels, origin at the feet, front faces -Z).
Every cube uses box UV: faces are laid out from `uv` as
    top (u+d, v) w×d, bottom (u+d+w, v) w×d,
    east/right (u, v+d) d×h, north/front (u+d, v+d) w×h, west/left (u+d+w, v+d) d×h, south/back (u+2d+w, v+d) w×h.
"""


def cube(origin, size, uv, inflate=None):
    c = {"origin": list(origin), "size": list(size), "uv": list(uv)}
    if inflate:
        c["inflate"] = inflate
    return c


def humanoid_bones(layers=True):
    """Standard 64x64 player-style humanoid with skin layers and an item locator bone."""
    bones = [
        {"name": "root", "pivot": [0, 0, 0]},
        {"name": "waist", "parent": "root", "pivot": [0, 12, 0]},
        {"name": "body", "parent": "waist", "pivot": [0, 24, 0], "cubes": [cube([-4, 12, -2], [8, 12, 4], [16, 16])]},
        {"name": "head", "parent": "body", "pivot": [0, 24, 0], "cubes": [cube([-4, 24, -4], [8, 8, 8], [0, 0])]},
        {"name": "hat", "parent": "head", "pivot": [0, 24, 0], "cubes": [cube([-4, 24, -4], [8, 8, 8], [32, 0], 0.5)]},
        {"name": "rightArm", "parent": "body", "pivot": [-5, 22, 0], "cubes": [cube([-8, 12, -2], [4, 12, 4], [40, 16])]},
        {"name": "rightItem", "parent": "rightArm", "pivot": [-6, 15, 1]},
        {"name": "leftArm", "parent": "body", "pivot": [5, 22, 0], "cubes": [cube([4, 12, -2], [4, 12, 4], [32, 48])]},
        {"name": "leftItem", "parent": "leftArm", "pivot": [6, 15, 1]},
        {"name": "rightLeg", "parent": "root", "pivot": [-1.9, 12, 0], "cubes": [cube([-3.9, 0, -2], [4, 12, 4], [0, 16])]},
        {"name": "leftLeg", "parent": "root", "pivot": [1.9, 12, 0], "cubes": [cube([-0.1, 0, -2], [4, 12, 4], [16, 48])]},
    ]
    if layers:
        bones += [
            {"name": "jacket", "parent": "body", "pivot": [0, 24, 0], "cubes": [cube([-4, 12, -2], [8, 12, 4], [16, 32], 0.25)]},
            {"name": "rightSleeve", "parent": "rightArm", "pivot": [-5, 22, 0], "cubes": [cube([-8, 12, -2], [4, 12, 4], [40, 32], 0.25)]},
            {"name": "leftSleeve", "parent": "leftArm", "pivot": [5, 22, 0], "cubes": [cube([4, 12, -2], [4, 12, 4], [48, 48], 0.25)]},
            {"name": "rightPants", "parent": "rightLeg", "pivot": [-1.9, 12, 0], "cubes": [cube([-3.9, 0, -2], [4, 12, 4], [0, 32], 0.25)]},
            {"name": "leftPants", "parent": "leftLeg", "pivot": [1.9, 12, 0], "cubes": [cube([-0.1, 0, -2], [4, 12, 4], [0, 48], 0.25)]},
        ]
    return bones


def captain_bones():
    """Varek, the Crimson King: humanoid + long captain's coat, epaulettes, collar and tricorne (128x64)."""
    bones = humanoid_bones()
    bones += [
        {"name": "coat", "parent": "body", "pivot": [0, 24, 2.6], "cubes": [cube([-5, 3, 2.2], [10, 21, 1], [64, 0])]},
        {"name": "collar", "parent": "body", "pivot": [0, 24, 0], "cubes": [cube([-4.5, 22, -2.5], [9, 3, 5], [100, 0])]},
        {"name": "rightEpaulette", "parent": "rightArm", "pivot": [-5, 22, 0], "cubes": [cube([-8.5, 21, -2.5], [5, 2, 5], [64, 24])]},
        {"name": "leftEpaulette", "parent": "leftArm", "pivot": [5, 22, 0], "cubes": [cube([3.5, 21, -2.5], [5, 2, 5], [84, 24])]},
        {"name": "hatCrown", "parent": "head", "pivot": [0, 32, 0], "cubes": [cube([-4.5, 32, -4.5], [9, 3, 9], [64, 32])]},
        {"name": "hatBrim", "parent": "head", "pivot": [0, 32, 0], "cubes": [cube([-6.5, 31.5, -6], [13, 1, 12], [64, 44])]},
    ]
    return bones


def face_rects(c):
    """Pixel rectangles (x, y, w, h) for each face of a box-UV cube."""
    (w, h, d) = [int(round(v)) for v in c["size"]]
    (u, v) = c["uv"]
    return {
        "top": (u + d, v, w, d),
        "bottom": (u + d + w, v, w, d),
        "right": (u, v + d, d, h),
        "front": (u + d, v + d, w, h),
        "left": (u + d + w, v + d, d, h),
        "back": (u + 2 * d + w, v + d, w, h),
    }


def geometry(identifier, bones, tw, th, bounds=(3, 3.5)):
    return {
        "format_version": "1.12.0",
        "minecraft:geometry": [
            {
                "description": {
                    "identifier": identifier,
                    "texture_width": tw,
                    "texture_height": th,
                    "visible_bounds_width": bounds[0],
                    "visible_bounds_height": bounds[1],
                    "visible_bounds_offset": [0, bounds[1] / 2, 0],
                },
                "bones": bones,
            }
        ],
    }


def fist_bones():
    return [
        {"name": "root", "pivot": [0, 0, 0], "cubes": [cube([-3, -3, -3], [6, 6, 6], [0, 0]), cube([-2, -2, 3], [4, 4, 3], [0, 12])]},
    ]


def spear_bones():
    return [
        {"name": "root", "pivot": [0, 0, 0], "cubes": [cube([-1, -1, -8], [2, 2, 14], [0, 0]), cube([-0.5, -0.5, -10], [1, 1, 2], [0, 16])]},
    ]


def bullet_bones():
    return [{"name": "root", "pivot": [0, 0, 0], "cubes": [cube([-1, -1, -1], [2, 2, 2], [0, 0])]}]


def empty_bones():
    return [{"name": "root", "pivot": [0, 0, 0]}]
