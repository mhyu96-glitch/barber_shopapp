import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const BarberProApp());

    // Basic check for one of the initial route texts (Login)
    expect(find.text('BARBERPRO'), findsWidgets);
  });
}
