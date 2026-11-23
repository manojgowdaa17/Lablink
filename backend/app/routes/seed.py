from flask import Blueprint, jsonify, request
from ..extensions import mongo
from ..config import Config
from datetime import datetime, timezone

seed_bp = Blueprint("seed", __name__)

SAMPLE_EQUIPMENT = [
    {
        "name": "NVIDIA DGX A100 Workstation",
        "category": "Computing",
        "department": "CS & AI Lab",
        "lab_name": "AI Research Lab",
        "lab_location": "Engineering Block B, Room 204",
        "short_description": "8× A100 GPUs, 320GB HBM2e memory for large-scale ML training.",
        "full_description": "The NVIDIA DGX A100 is the universal system for all AI infrastructure providing unprecedented compute density, performance and flexibility. Features 8x A100 Tensor Core GPUs with 320GB total GPU memory.",
        "specifications": {"GPUs": "8× NVIDIA A100 80GB", "CPU": "2× AMD EPYC 7742 64-Core", "RAM": "1TB DDR4", "Storage": "30TB NVMe SSD"},
        "status": "available",
        "is_featured": True,
        "access_level": "supervised",
        "image_url": "",
        "quantity": 1,
        "available_quantity": 1,
        "maintenance_schedule": [],
        "prerequisites": ["GPU Computing Basics certification", "Faculty supervisor required"],
    },
    {
        "name": "ZEISS Axio Observer",
        "category": "Biotech",
        "department": "Life Sciences Lab",
        "lab_name": "Microscopy Suite",
        "lab_location": "Science Block A, Room 101",
        "short_description": "Inverted fluorescence microscope with Apotome.2 optical sectioning.",
        "full_description": "The ZEISS Axio Observer is an inverted microscope platform for life science and materials research with modular design and high-performance optics.",
        "specifications": {"Type": "Inverted Fluorescence", "Magnification": "2.5x–100x", "Camera": "AxioCam 702 mono", "Channels": "DAPI, GFP, mCherry, Brightfield"},
        "status": "available",
        "is_featured": True,
        "access_level": "supervised",
        "image_url": "",
        "quantity": 2,
        "available_quantity": 2,
        "maintenance_schedule": [],
        "prerequisites": ["Lab Safety Training", "Microscopy orientation session"],
    },
    {
        "name": "Keysight DSOX6004A Oscilloscope",
        "category": "Electronics",
        "department": "Electronics Lab",
        "lab_name": "Electronics Workbench",
        "lab_location": "Engineering Block A, Room 310",
        "short_description": "4-channel 1GHz oscilloscope with 20GSa/s real-time sampling.",
        "full_description": "The Keysight InfiniiVision DSOX6004A provides 4 analog channels at 1 GHz bandwidth with 20 GSa/s sample rate and 4 Mpts memory depth.",
        "specifications": {"Bandwidth": "1 GHz", "Channels": "4 analog", "Sample Rate": "20 GSa/s", "Memory Depth": "4 Mpts", "Display": "12.1 inch WXGA"},
        "status": "in-use",
        "is_featured": True,
        "access_level": "open",
        "image_url": "",
        "quantity": 3,
        "available_quantity": 1,
        "maintenance_schedule": [],
        "prerequisites": [],
    },
    {
        "name": "FANUC LR Mate 200iD Robot Arm",
        "category": "Mechanical",
        "department": "Robotics Lab",
        "lab_name": "Robotics & Automation Lab",
        "lab_location": "Engineering Block C, Room 405",
        "short_description": "6-axis industrial robot arm, 7kg payload, ±0.02mm repeatability.",
        "full_description": "The FANUC LR Mate 200iD is a high-speed, high-precision 6-axis robot with 717mm reach, ideal for assembly, handling and machine tending applications.",
        "specifications": {"Axes": "6", "Payload": "7kg", "Reach": "717mm", "Repeatability": "±0.02mm", "Weight": "25kg"},
        "status": "available",
        "is_featured": True,
        "access_level": "supervised",
        "image_url": "",
        "quantity": 1,
        "available_quantity": 1,
        "maintenance_schedule": [],
        "prerequisites": ["Robotics Safety Training", "FANUC controller certification"],
    },
    {
        "name": "Raspberry Pi Cluster (32 nodes)",
        "category": "Computing",
        "department": "IoT Research Lab",
        "lab_name": "IoT & Edge Computing Lab",
        "lab_location": "Engineering Block B, Room 108",
        "short_description": "32-node Pi 4 cluster for distributed systems and edge AI research.",
        "full_description": "32-node Raspberry Pi 4 Model B cluster with 8GB RAM per node, connected via Gigabit Ethernet switch. Runs Kubernetes for container orchestration.",
        "specifications": {"Nodes": "32× Raspberry Pi 4", "RAM per node": "8GB", "Storage": "256GB SD per node", "Network": "Gigabit Ethernet", "OS": "Ubuntu 22.04"},
        "status": "maintenance",
        "is_featured": True,
        "access_level": "open",
        "image_url": "",
        "quantity": 1,
        "available_quantity": 0,
        "maintenance_schedule": [],
        "prerequisites": [],
    },
    {
        "name": "3D Systems ProJet MJP 2500",
        "category": "Mechanical",
        "department": "Design & Fab Lab",
        "lab_name": "Fabrication Studio",
        "lab_location": "Design Block, Room 201",
        "short_description": "Multi-Jet Printing with 32µm layer resolution for precision prototyping.",
        "full_description": "The 3D Systems ProJet MJP 2500 uses Multi-Jet Printing technology with VisiJet materials to produce precise, smooth parts with fine detail.",
        "specifications": {"Technology": "Multi-Jet Printing", "Layer Resolution": "32µm", "Build Volume": "294 × 211 × 144mm", "Materials": "VisiJet M2R-WT, M2G-CL"},
        "status": "available",
        "is_featured": True,
        "access_level": "supervised",
        "image_url": "",
        "quantity": 1,
        "available_quantity": 1,
        "maintenance_schedule": [],
        "prerequisites": ["3D Printing orientation"],
    },
    {
        "name": "Spectrum Analyzer Rohde & Schwarz FSV3000",
        "category": "Electronics",
        "department": "RF & Communications Lab",
        "lab_name": "RF Lab",
        "lab_location": "Engineering Block A, Room 320",
        "short_description": "Signal and spectrum analyzer, 10Hz–13.6GHz, for RF signal analysis.",
        "full_description": "The R&S FSV3000 is a high-performance signal and spectrum analyzer with fast sweep speed and excellent phase noise for 5G NR, LTE, WLAN analysis.",
        "specifications": {"Frequency Range": "10Hz–13.6GHz", "Phase Noise": "-117dBc/Hz at 1GHz", "Dynamic Range": "78dB", "Display": "12.1 inch touchscreen"},
        "status": "available",
        "is_featured": False,
        "access_level": "supervised",
        "image_url": "",
        "quantity": 1,
        "available_quantity": 1,
        "maintenance_schedule": [],
        "prerequisites": ["RF Safety Briefing"],
    },
    {
        "name": "Arduino Uno R3 Kit (Set of 20)",
        "category": "Electronics",
        "department": "Electronics Lab",
        "lab_name": "Maker Space",
        "lab_location": "Engineering Block A, Room 102",
        "short_description": "Complete Arduino prototyping kit for embedded systems projects.",
        "full_description": "Set of 20 Arduino Uno R3 boards with comprehensive component kits including sensors, actuators, and prototyping accessories.",
        "specifications": {"Boards": "20× Arduino Uno R3", "Microcontroller": "ATmega328P", "Components": "Sensors, LEDs, Resistors, Breadboards"},
        "status": "available",
        "is_featured": False,
        "access_level": "open",
        "image_url": "",
        "quantity": 20,
        "available_quantity": 15,
        "maintenance_schedule": [],
        "prerequisites": [],
    },
]


@seed_bp.route("/seed", methods=["POST"])
def seed_database():
    if Config.FLASK_ENV != "development":
        return jsonify({"error": "Seeding only allowed in development mode."}), 403

    secret = request.headers.get("X-Setup-Secret", "")
    if secret != Config.ADMIN_SETUP_SECRET:
        return jsonify({"error": "Forbidden."}), 403

    now = datetime.now(timezone.utc)
    inserted = 0
    for item in SAMPLE_EQUIPMENT:
        if not mongo.db.equipment.find_one({"name": item["name"]}):
            item["created_at"] = now
            item["updated_at"] = now
            mongo.db.equipment.insert_one(item)
            inserted += 1

    return jsonify({
        "message": f"Seeded {inserted} new equipment records ({len(SAMPLE_EQUIPMENT) - inserted} already existed).",
        "total_equipment": mongo.db.equipment.count_documents({}),
    })
