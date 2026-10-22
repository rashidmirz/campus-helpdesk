import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base
from app.seed import seed_database

@pytest_asyncio.fixture(scope="module", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database(reset=True)
    yield

@pytest.mark.asyncio
async def test_logins_all_roles():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Student login with ID
        res = await client.post("/api/auth/login", json={"login": "STU-8842", "password": "Aarav@2026"})
        assert res.status_code == 200, res.text
        data = res.json()
        assert "token" in data
        assert data["user"]["role"] == "student"

        # Student login with email
        res = await client.post("/api/auth/login", json={"login": "aarav.sharma@silveroak.edu.in", "password": "Aarav@2026"})
        assert res.status_code == 200
        assert res.json()["user"]["id"] == "STU-8842"

        # Faculty login
        res = await client.post("/api/auth/login", json={"login": "FAC-1044", "password": "Priya@2026"})
        assert res.status_code == 200
        assert res.json()["user"]["role"] == "faculty"

        # Admin login
        res = await client.post("/api/auth/login", json={"login": "ADM-001", "password": "Admin@2026"})
        assert res.status_code == 200
        assert res.json()["user"]["role"] == "admin"

        # Invalid credentials
        res = await client.post("/api/auth/login", json={"login": "ADM-001", "password": "WrongPassword"})
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_ticket_lifecycle_and_security():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login as student Aarav
        res_stu = await client.post("/api/auth/login", json={"login": "STU-8842", "password": "Aarav@2026"})
        stu_token = res_stu.json()["token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # 2. Login as admin Vikram
        res_adm = await client.post("/api/auth/login", json={"login": "ADM-001", "password": "Admin@2026"})
        adm_token = res_adm.json()["token"]
        adm_headers = {"Authorization": f"Bearer {adm_token}"}

        # 3. Create ticket as student
        res_create = await client.post("/api/tickets", headers=stu_headers, json={
            "subject": "Lab computer screen flickering",
            "category": "it",
            "priority": "high",
            "description": "Lab 3 PC 12 screen keeps flickering black every 2 minutes.",
            "location": "Lab 3"
        })
        assert res_create.status_code == 201, res_create.text
        ticket = res_create.json()
        ticket_id = ticket["id"]
        assert ticket["requesterId"] == "STU-8842"
        assert ticket["status"] == "new"

        # 4. Admin replies with internal note
        res_note = await client.post(f"/api/tickets/{ticket_id}/messages", headers=adm_headers, json={
            "body": "Checking graphics driver logs on lab host.",
            "type": "internal"
        })
        assert res_note.status_code == 200

        # 5. Student cannot post internal note (must be 403)
        res_bad_note = await client.post(f"/api/tickets/{ticket_id}/messages", headers=stu_headers, json={
            "body": "Trying to bypass internal note security.",
            "type": "internal"
        })
        assert res_bad_note.status_code == 403

        # 6. Verify internal note is hidden from student
        res_view_stu = await client.get(f"/api/tickets/{ticket_id}", headers=stu_headers)
        assert res_view_stu.status_code == 200
        messages_stu = res_view_stu.json()["messages"]
        assert all(m["type"] != "internal" for m in messages_stu)

        # But admin sees internal note
        res_view_adm = await client.get(f"/api/tickets/{ticket_id}", headers=adm_headers)
        assert res_view_adm.status_code == 200
        messages_adm = res_view_adm.json()["messages"]
        assert any(m["type"] == "internal" for m in messages_adm)

        # 7. Admin posts public reply -> status moves to in_review
        res_pub_reply = await client.post(f"/api/tickets/{ticket_id}/messages", headers=adm_headers, json={
            "body": "We have replaced the HDMI cable.",
            "type": "public"
        })
        assert res_pub_reply.status_code == 200
        updated_t = res_pub_reply.json()
        assert updated_t["status"] == "in_review"
        assert updated_t["firstResponseAt"] is not None

        # 8. Admin changes status to resolved
        res_resolve = await client.patch(f"/api/tickets/{ticket_id}", headers=adm_headers, json={
            "status": "resolved"
        })
        assert res_resolve.status_code == 200
        assert res_resolve.json()["status"] == "resolved"
        assert res_resolve.json()["resolvedAt"] is not None

        # 9. Student rates the ticket -> closes ticket
        res_rate = await client.post(f"/api/tickets/{ticket_id}/rating", headers=stu_headers, json={
            "rating": 5,
            "comment": "Working smoothly now, thank you!"
        })
        assert res_rate.status_code == 200
        rated_t = res_rate.json()
        assert rated_t["status"] == "closed"
        assert rated_t["csat"]["rating"] == 5

@pytest.mark.asyncio
async def test_role_denial_and_fees():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Student credentials
        res_stu = await client.post("/api/auth/login", json={"login": "STU-8842", "password": "Aarav@2026"})
        stu_token = res_stu.json()["token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # 1. Student accessing admin-only endpoint: Analytics -> 403 Forbidden
        res_analytics = await client.get("/api/analytics/overview", headers=stu_headers)
        assert res_analytics.status_code == 403

        # 2. Student accessing admin-only endpoint: People directory -> 403 Forbidden
        res_people = await client.get("/api/people?type=students", headers=stu_headers)
        assert res_people.status_code == 403

        # 3. Fees: student gets their own fees
        res_fees = await client.get("/api/fees", headers=stu_headers)
        assert res_fees.status_code == 200
        fees = res_fees.json()
        assert len(fees) > 0
        due_items = [f for f in fees if f["status"] == "due"]

        if due_items:
            pay_id = due_items[0]["id"]
            # Pay fee
            res_pay = await client.post("/api/fees/pay", headers=stu_headers, json={
                "ids": [pay_id],
                "method": "UPI"
            })
            assert res_pay.status_code == 200
            receipt = res_pay.json()
            assert "id" in receipt
            assert receipt["total"] > 0
